/**
 * ESPN Cricinfo data fetching.
 *
 * Primary:  hs-consumer-api.espncricinfo.com  (the website's own JSON API)
 * Fallback: /ci/content/player/{id}.json      (older endpoint, still works for many players)
 *
 * Both require a short delay between requests to avoid rate-limiting.
 */
import { readCache, writeCache } from './cache.js';

const CONSUMER_BASE = 'https://hs-consumer-api.espncricinfo.com/v1/pages/player';
const LEGACY_BASE   = 'https://www.espncricinfo.com/ci/content/player';

// Format class codes used by Cricinfo
export const FORMAT = { TEST: 1, ODI: 2, T20I: 3, IPL: 6 } as const;

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, */*',
  Origin: 'https://www.espncricinfo.com',
  Referer: 'https://www.espncricinfo.com/',
  'sec-fetch-site': 'same-site',
  'sec-fetch-mode': 'cors',
};

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── Types ──────────────────────────────────────────────────────────────────

export interface PlayerStats {
  cricinfoId: string;
  testRuns: number;
  testWickets: number;
  testCenturies: number;
  odiWickets: number;
  t20iWickets: number;
  playedIpl: boolean;
}

// ── Consumer API ───────────────────────────────────────────────────────────

interface ConsumerStatRow {
  heading?: string;
  values?: string[];
}

async function fetchConsumerStats(playerId: string, formatClass: number): Promise<ConsumerStatRow[]> {
  const url = `${CONSUMER_BASE}/stats?playerId=${playerId}&type=allround&formatClass=${formatClass}`;
  const res = await fetch(url, { headers: BROWSER_HEADERS });
  if (!res.ok) throw new Error(`consumer API ${res.status}`);
  const json = await res.json() as { stats?: { battingStats?: ConsumerStatRow[]; bowlingStats?: ConsumerStatRow[] } };
  return [
    ...(json.stats?.battingStats ?? []),
    ...(json.stats?.bowlingStats ?? []),
  ];
}

function parseStatRow(rows: ConsumerStatRow[], heading: string): number {
  const row = rows.find(r => r.heading?.toLowerCase().includes(heading.toLowerCase()));
  if (!row?.values?.length) return 0;
  const v = parseInt(row.values[0].replace(/[^0-9]/g, ''), 10);
  return isNaN(v) ? 0 : v;
}

// ── Legacy JSON API ────────────────────────────────────────────────────────

interface LegacyProfile {
  player?: {
    batting?: { testmatch?: { runs?: number; hundreds?: number }; odimatch?: {} };
    bowling?: { testmatch?: { wickets?: number }; odimatch?: { wickets?: number }; twentymatch?: { wickets?: number } };
  };
}

async function fetchLegacyStats(playerId: string): Promise<Partial<PlayerStats>> {
  const url = `${LEGACY_BASE}/${playerId}.json`;
  const res = await fetch(url, { headers: { 'User-Agent': BROWSER_HEADERS['User-Agent'] } });
  if (!res.ok) throw new Error(`legacy API ${res.status}`);
  const json = await res.json() as LegacyProfile;
  const p = json.player;
  return {
    testRuns:      p?.batting?.testmatch?.runs ?? 0,
    testCenturies: p?.batting?.testmatch?.hundreds ?? 0,
    testWickets:   p?.bowling?.testmatch?.wickets ?? 0,
    odiWickets:    p?.bowling?.odimatch?.wickets ?? 0,
    t20iWickets:   p?.bowling?.twentymatch?.wickets ?? 0,
  };
}

// ── Public fetch ───────────────────────────────────────────────────────────

export async function fetchPlayerStats(
  playerId: string,
  rateLimitMs = 400,
): Promise<PlayerStats> {
  const cacheKey = `cricinfo-stats-${playerId}`;
  const cached = await readCache<PlayerStats>(cacheKey);
  if (cached) return cached;

  await sleep(rateLimitMs);

  // Try consumer API first (richer data)
  try {
    const [testRows, odiRows, t20Rows, iplRows] = await Promise.allSettled([
      fetchConsumerStats(playerId, FORMAT.TEST),
      fetchConsumerStats(playerId, FORMAT.ODI),
      fetchConsumerStats(playerId, FORMAT.T20I),
      fetchConsumerStats(playerId, FORMAT.IPL),
    ]);

    const test = testRows.status === 'fulfilled' ? testRows.value : [];
    const odi  = odiRows.status  === 'fulfilled' ? odiRows.value  : [];
    const t20  = t20Rows.status  === 'fulfilled' ? t20Rows.value  : [];
    const ipl  = iplRows.status  === 'fulfilled' ? iplRows.value  : [];

    const stats: PlayerStats = {
      cricinfoId: playerId,
      testRuns:      parseStatRow(test, 'runs'),
      testCenturies: parseStatRow(test, '100'),
      testWickets:   parseStatRow(test, 'wickets'),
      odiWickets:    parseStatRow(odi,  'wickets'),
      t20iWickets:   parseStatRow(t20,  'wickets'),
      playedIpl:     ipl.length > 0,
    };

    if (stats.testRuns > 0 || stats.testWickets > 0) {
      await writeCache(cacheKey, stats);
      return stats;
    }
    // Fall through to legacy if consumer returned nothing useful
  } catch {
    // Consumer API unavailable — fall through
  }

  // Fallback: legacy JSON endpoint
  try {
    const partial = await fetchLegacyStats(playerId);
    const stats: PlayerStats = {
      cricinfoId: playerId,
      testRuns:      partial.testRuns      ?? 0,
      testCenturies: partial.testCenturies ?? 0,
      testWickets:   partial.testWickets   ?? 0,
      odiWickets:    partial.odiWickets    ?? 0,
      t20iWickets:   partial.t20iWickets   ?? 0,
      playedIpl:     false,
    };
    await writeCache(cacheKey, stats);
    return stats;
  } catch (e) {
    console.warn(`    [cricinfo] could not fetch stats for ${playerId}: ${(e as Error).message}`);
    return {
      cricinfoId: playerId,
      testRuns: 0, testCenturies: 0, testWickets: 0,
      odiWickets: 0, t20iWickets: 0, playedIpl: false,
    };
  }
}

// ── Statsguru CSV (best-effort) ────────────────────────────────────────────
// Cricinfo Statsguru is behind Cloudflare. This function tries a browser-like
// request; if it gets blocked it logs a warning and returns null.
// The user can manually download CSVs to scripts/data/ as a fallback.

export interface StatsguroBatter {
  name: string;
  cricinfoId: string;
  runs: number;
  centuries: number;
  span: string;
}

export async function fetchStatsguru(
  teamId: number,
  format: 1 | 2,        // 1=Test, 2=ODI
  statType: 'batting' | 'bowling',
  minThreshold = 0,
): Promise<StatsguroBatter[] | null> {
  const cacheKey = `statsguru-${teamId}-${format}-${statType}-${minThreshold}`;
  const cached = await readCache<StatsguroBatter[]>(cacheKey);
  if (cached) return cached;

  await sleep(600);

  const url = [
    'https://stats.espncricinfo.com/ci/engine/stats/index.html',
    `?class=${format}&team=${teamId}&type=${statType}`,
    `&minimum=${minThreshold}&template=results&view=player&output=csv`,
  ].join('');

  try {
    const res = await fetch(url, {
      headers: {
        ...BROWSER_HEADERS,
        Accept: 'text/csv,text/plain,*/*',
        Referer: 'https://stats.espncricinfo.com/',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      console.warn(`    [statsguru] ${res.status} for team=${teamId} — skipping`);
      return null;
    }

    const text = await res.text();
    if (!text.includes(',') || text.toLowerCase().includes('<html')) {
      console.warn(`    [statsguru] blocked or unexpected response for team=${teamId}`);
      return null;
    }

    const rows = parseStatsguroCsv(text, statType);
    await writeCache(cacheKey, rows);
    return rows;
  } catch (e) {
    console.warn(`    [statsguru] fetch error for team=${teamId}:`, (e as Error).message);
    return null;
  }
}

function parseStatsguroCsv(csv: string, type: 'batting' | 'bowling'): StatsguroBatter[] {
  const lines = csv.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  const idx = {
    player:   headers.indexOf('player'),
    runs:     type === 'batting' ? headers.indexOf('runs') : -1,
    wkts:     type === 'bowling' ? headers.indexOf('wkts') : -1,
    hundreds: headers.indexOf('100'),
    span:     headers.indexOf('span'),
  };

  const results: StatsguroBatter[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
    if (!cols[idx.player]) continue;

    // Extract Cricinfo ID from the player name cell which may look like:
    // "SR Tendulkar (INDIA)" or contain a URL like /player/sachin-tendulkar-35320
    const playerCell = cols[idx.player];
    const idMatch = playerCell.match(/\-(\d+)$/) ?? playerCell.match(/\/(\d+)(?:\.html)?/);
    if (!idMatch) continue;

    results.push({
      name:       playerCell.replace(/\s*\(.*?\)\s*$/, '').trim(),
      cricinfoId: idMatch[1],
      runs:       idx.runs >= 0 ? parseInt(cols[idx.runs] ?? '0', 10) || 0 : 0,
      centuries:  idx.hundreds >= 0 ? parseInt(cols[idx.hundreds] ?? '0', 10) || 0 : 0,
      span:       idx.span >= 0 ? cols[idx.span] : '',
    });
  }

  return results;
}

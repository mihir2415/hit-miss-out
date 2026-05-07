import { readCache, writeCache } from './cache.js';

const ENDPOINT = 'https://query.wikidata.org/sparql';

// Cricinfo team IDs → display name + Wikidata country Q-number(s)
export const CRICINFO_TEAMS: Record<number, { name: string; countryQs: string[] }> = {
  1: { name: 'England',      countryQs: ['Q145', 'Q21'] },       // UK / England
  2: { name: 'Australia',    countryQs: ['Q408'] },
  3: { name: 'South Africa', countryQs: ['Q258'] },
  4: { name: 'West Indies',  countryQs: ['Q766','Q754','Q244','Q734','Q763','Q769','Q781','Q757','Q784'] },
  5: { name: 'New Zealand',  countryQs: ['Q664'] },
  6: { name: 'India',        countryQs: ['Q668'] },
  7: { name: 'Pakistan',     countryQs: ['Q843'] },
  8: { name: 'Sri Lanka',    countryQs: ['Q854'] },
};

// Confirmed IPL franchise Wikidata IDs (add more as needed)
const IPL_FRANCHISE_QS = [
  'Q1195237', // Mumbai Indians
  'Q1292535', // Chennai Super Kings
  'Q1156897', // Royal Challengers Bangalore
  'Q1518836', // Sunrisers Hyderabad
  'Q1156894', // Kolkata Knight Riders
  'Q738648',  // Delhi Capitals
  'Q1163979', // Rajasthan Royals
  'Q1163974', // Punjab Kings (Kings XI Punjab)
  'Q1184534', // Deccan Chargers (defunct)
  'Q1163977', // Kochi Tuskers Kerala (defunct)
  'Q28640460',// Rising Pune Supergiants (defunct)
  'Q110490628',// Gujarat Titans
  'Q108792028',// Lucknow Super Giants
];

async function sparql<T>(query: string): Promise<T[]> {
  const url = `${ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'HitMissOut-CricketGame/1.0 (data seeding; contact via github)',
      Accept: 'application/sparql-results+json',
      'Accept-Encoding': 'identity',  // prevent gzip so Node.js JSON.parse works
    },
  });
  if (!res.ok) throw new Error(`Wikidata ${res.status}: ${await res.text().catch(() => '')}`);
  const json = await res.json() as { results: { bindings: Record<string, { value: string; type: string }>[] } };
  return json.results.bindings as unknown as T[];
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface WdCricketer {
  cricinfoId: string;
  name: string;
  country: string;   // Wikidata country label
  role: string;      // "batsman", "bowler", "all-rounder", "wicket-keeper", or ""
  captainOf: string; // team label if they captained, else ""
}

export interface WdIplPlayer {
  cricinfoId: string;
  teamName: string;
}

// ── Queries ────────────────────────────────────────────────────────────────

// Fetch per team to stay within Wikidata's response size limits
export async function fetchCricketers(): Promise<WdCricketer[]> {
  const cached = await readCache<WdCricketer[]>('wd-cricketers');
  if (cached) { console.log('  [cache] wikidata cricketers'); return cached; }

  console.log('  [wikidata] fetching international cricketers (per team)…');

  const allResults: WdCricketer[] = [];

  for (const [, team] of Object.entries(CRICINFO_TEAMS)) {
    const countryValues = team.countryQs.map(q => `wd:${q}`).join(' ');
    const query = `
SELECT DISTINCT ?player ?playerLabel ?cricinfoId ?countryLabel ?roleLabel WHERE {
  ?player wdt:P2697 ?cricinfoId .
  ?player wdt:P27 ?country .
  VALUES ?country { ${countryValues} }
  OPTIONAL { ?player wdt:P413 ?role }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
} LIMIT 500`;

    try {
      const rows = await sparql<{
        cricinfoId: { value: string };
        playerLabel: { value: string };
        countryLabel: { value: string };
        roleLabel?: { value: string };
      }>(query);

      const players: WdCricketer[] = rows.map(r => ({
        cricinfoId: r.cricinfoId.value,
        name: r.playerLabel.value,
        country: r.countryLabel.value,
        role: r.roleLabel?.value ?? '',
        captainOf: '',
      }));

      console.log(`    ${team.name.padEnd(14)} ${players.length} players`);
      allResults.push(...players);
    } catch (e) {
      console.warn(`    [wikidata] failed for ${team.name}:`, (e as Error).message);
    }

    // Brief pause between requests to be polite to Wikidata
    await new Promise(r => setTimeout(r, 1000));
  }

  await writeCache('wd-cricketers', allResults);
  console.log(`  [wikidata] total: ${allResults.length} cricketers`);
  return allResults;
}

export async function fetchIplPlayers(): Promise<WdIplPlayer[]> {
  const cached = await readCache<WdIplPlayer[]>('wd-ipl');
  if (cached) { console.log('  [cache] wikidata IPL players'); return cached; }

  console.log('  [wikidata] fetching IPL team memberships…');

  const teamValues = IPL_FRANCHISE_QS.map(q => `wd:${q}`).join(' ');

  const query = `
SELECT DISTINCT ?player ?playerLabel ?cricinfoId ?teamLabel WHERE {
  ?player wdt:P2697 ?cricinfoId .
  ?player p:P54 ?membership .
  ?membership ps:P54 ?team .
  VALUES ?team { ${teamValues} }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}`;

  const rows = await sparql<{
    cricinfoId: { value: string };
    playerLabel: { value: string };
    teamLabel: { value: string };
  }>(query);

  const results: WdIplPlayer[] = rows.map(r => ({
    cricinfoId: r.cricinfoId.value,
    teamName: r.teamLabel.value,
  }));

  await writeCache('wd-ipl', results);
  console.log(`  [wikidata] got ${results.length} IPL memberships`);
  return results;
}

export async function fetchCaptains(): Promise<Set<string>> {
  const cached = await readCache<string[]>('wd-captains');
  if (cached) { console.log('  [cache] wikidata captains'); return new Set(cached); }

  console.log('  [wikidata] fetching national team captains…');

  // P2697 players who are listed as captain (P18 head coach/manager or P286 head coach
  // Actually: use "position held" P39 or just look for "captain" in sports role P413)
  // Simpler: any player whose P413 includes "captain" label
  const query = `
SELECT DISTINCT ?cricinfoId WHERE {
  ?player wdt:P2697 ?cricinfoId .
  ?player wdt:P413 ?role .
  ?role wdt:P31*/wdt:P279* wd:Q1144080 .
}`;
  // Q1144080 = captain (sports)

  try {
    const rows = await sparql<{ cricinfoId: { value: string } }>(query);
    const ids = rows.map(r => r.cricinfoId.value);
    await writeCache('wd-captains', ids);
    console.log(`  [wikidata] got ${ids.length} captains`);
    return new Set(ids);
  } catch (e) {
    console.warn('  [wikidata] captains query failed, skipping:', (e as Error).message);
    return new Set();
  }
}

// Derive which Cricinfo team ID a Wikidata country label maps to
export function countryToTeam(countryLabel: string): string | null {
  const l = countryLabel.toLowerCase();
  if (l.includes('india')) return 'India';
  if (l.includes('australia')) return 'Australia';
  if (l.includes('england') || l.includes('united kingdom') || l.includes('great britain')) return 'England';
  if (l.includes('pakistan')) return 'Pakistan';
  if (l.includes('south africa')) return 'South Africa';
  if (l.includes('new zealand')) return 'New Zealand';
  if (l.includes('sri lanka')) return 'Sri Lanka';
  // Caribbean nations → West Indies
  const caribbean = ['jamaica','trinidad','barbados','guyana','saint lucia','grenada','antigua','dominica','saint vincent'];
  if (caribbean.some(c => l.includes(c))) return 'West Indies';
  return null;
}

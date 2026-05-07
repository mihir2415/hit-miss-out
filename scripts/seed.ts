/**
 * npm run seed
 *
 * Data sources:
 *  1. src/data/players.ts  — curated stats baseline (runs, wickets, centuries).
 *                            Edit this file to update stats; run seed to re-enrich.
 *  2. Wikidata SPARQL       — IPL team memberships, playing roles, captaincy.
 *     (results cached in .cache/ for 24 h — delete to force refresh)
 *  3. scripts/lib/worldcup.ts — hardcoded ODI World Cup winners.
 *
 * ESPN Cricinfo stats API is blocked (403). If that changes, uncomment the
 * Cricinfo block and add `npm install node-fetch` for server-side fetching.
 *
 * Outputs → src/data/players.ts  (overwrites with enriched data)
 */

import fs from 'fs/promises';
import path from 'path';
import { fetchCricketers, fetchIplPlayers, fetchCaptains, countryToTeam } from './lib/wikidata.js';
import { getWorldCupWins } from './lib/worldcup.js';

// ── Inline type (avoids tsx cross-project import issues) ───────────────────
interface CricketPlayer {
  id: string; name: string; aliases: string[]; teams: string[];
  testRuns: number; testWickets: number; odiWickets: number; t20iWickets: number;
  testCenturies: number; worldCupWins: string[]; iplTeams: string[];
  captainedNational: boolean; isAllrounder: boolean;
}

// ── Name normalisation + matching ──────────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
}

function nameSimilarity(a: string, b: string): number {
  const na = norm(a), nb = norm(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const wordsA = new Set(na.split(' '));
  const wordsB = new Set(nb.split(' '));
  const shared = [...wordsA].filter(w => wordsB.has(w) && w.length > 2).length;
  const total  = Math.max(wordsA.size, wordsB.size);
  return shared / total;
}

/** Find the best-matching Wikidata player for a given name. */
function matchWd(
  name: string,
  wdByCountry: Map<string, { cricinfoId: string; name: string; role: string }[]>,
  team: string,
): { cricinfoId: string; role: string } | null {
  const candidates = wdByCountry.get(team) ?? [];
  let best = { score: 0, cricinfoId: '', role: '' };
  for (const wd of candidates) {
    const score = nameSimilarity(name, wd.name);
    if (score > best.score) best = { score, cricinfoId: wd.cricinfoId, role: wd.role };
  }
  return best.score >= 0.6 ? best : null;
}

function slugify(name: string, id: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + id;
}

function parseRole(role: string): boolean {
  const r = role.toLowerCase();
  return r.includes('all') || r.includes('all-round') || r.includes('allround');
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏏  Hit Miss Out — Player Data Seeder\n');

  // 1. Load hardcoded stats baseline ─────────────────────────────────────
  console.log('Step 1/4  Loading stats baseline from src/data/players.ts…');

  // Dynamic import so tsx resolves the TypeScript source
  const { PLAYERS: HARDCODED } = await import('../src/data/players.js') as { PLAYERS: CricketPlayer[] };
  console.log(`  → ${HARDCODED.length} players in stats baseline\n`);

  // 2. Fetch Wikidata ─────────────────────────────────────────────────────
  console.log('Step 2/4  Wikidata queries (using cache if available)…');
  const [wdPlayers, iplMemberships, captainIds] = await Promise.all([
    fetchCricketers(),
    fetchIplPlayers(),
    fetchCaptains(),
  ]);

  // Index Wikidata players by team for fast name matching
  const wdByTeam = new Map<string, { cricinfoId: string; name: string; role: string }[]>();
  for (const wd of wdPlayers) {
    const team = countryToTeam(wd.country);
    if (!team) continue;
    if (!wdByTeam.has(team)) wdByTeam.set(team, []);
    wdByTeam.get(team)!.push({ cricinfoId: wd.cricinfoId, name: wd.name, role: wd.role });
  }

  // Build lookup: cricinfoId → IPL teams
  const iplByPlayer = new Map<string, Set<string>>();
  for (const { cricinfoId, teamName } of iplMemberships) {
    if (!iplByPlayer.has(cricinfoId)) iplByPlayer.set(cricinfoId, new Set());
    iplByPlayer.get(cricinfoId)!.add(teamName);
  }

  // Build lookup: cricinfoId → name (for new-player discovery)
  const wdById = new Map<string, { name: string; team: string; role: string }>();
  for (const wd of wdPlayers) {
    const team = countryToTeam(wd.country);
    if (team) wdById.set(wd.cricinfoId, { name: wd.name, team, role: wd.role });
  }

  console.log(`  → ${wdPlayers.length} Wikidata players, ${iplMemberships.length} IPL memberships\n`);

  // 3. Enrich hardcoded players with Wikidata metadata ───────────────────
  console.log('Step 3/4  Merging…');

  const enriched: CricketPlayer[] = [];
  const matchedCricinfoIds = new Set<string>();

  for (const base of HARDCODED) {
    const team = base.teams[0];
    const wd = matchWd(base.name, wdByTeam, team);
    const cricinfoId = wd?.cricinfoId ?? '';

    if (cricinfoId) matchedCricinfoIds.add(cricinfoId);

    const iplTeamsFromWd = cricinfoId ? [...(iplByPlayer.get(cricinfoId) ?? [])] : [];
    // Merge: prefer Wikidata IPL data; fall back to what we already had
    const iplTeams = iplTeamsFromWd.length > 0 ? iplTeamsFromWd : base.iplTeams;

    const isCaptain    = (cricinfoId && captainIds.has(cricinfoId)) || base.captainedNational;
    const isAllrounder = (wd ? parseRole(wd.role) : false) || base.isAllrounder;
    const wcWins       = cricinfoId
      ? getWorldCupWins(cricinfoId)
      : base.worldCupWins;

    enriched.push({
      ...base,
      id:               cricinfoId ? slugify(base.name, cricinfoId) : base.id,
      iplTeams,
      captainedNational: isCaptain,
      isAllrounder,
      worldCupWins:     wcWins.length > 0 ? wcWins : base.worldCupWins,
    });
  }

  // 4. Add new players from Wikidata (not already in hardcoded list) ──────
  // Only add players with IPL data or WC wins — skip unknown fringe players
  let newCount = 0;
  for (const [cricinfoId, meta] of wdById) {
    if (matchedCricinfoIds.has(cricinfoId)) continue;

    const iplTeams  = [...(iplByPlayer.get(cricinfoId) ?? [])];
    const wcWins    = getWorldCupWins(cricinfoId);
    const isCaptain = captainIds.has(cricinfoId);

    if (iplTeams.length === 0 && wcWins.length === 0 && !isCaptain) continue;

    enriched.push({
      id:               slugify(meta.name, cricinfoId),
      name:             meta.name,
      aliases:          [],
      teams:            [meta.team],
      testRuns:         0,
      testWickets:      0,
      odiWickets:       0,
      t20iWickets:      0,
      testCenturies:    0,
      worldCupWins:     wcWins,
      iplTeams,
      captainedNational: isCaptain,
      isAllrounder:     parseRole(meta.role),
    });
    newCount++;
  }

  // Sort: hardcoded players first (by test runs), then new Wikidata additions
  enriched.sort((a, b) => {
    const aIsNew = a.testRuns === 0 && a.testWickets === 0;
    const bIsNew = b.testRuns === 0 && b.testWickets === 0;
    if (aIsNew !== bIsNew) return aIsNew ? 1 : -1;
    return (b.testRuns + b.testWickets * 30) - (a.testRuns + a.testWickets * 30);
  });

  console.log(`  → ${HARDCODED.length} enriched  +  ${newCount} new players from Wikidata`);
  console.log(`  → Total: ${enriched.length} players\n`);

  // 5. Write output ───────────────────────────────────────────────────────
  console.log('Step 4/4  Writing src/data/players.ts…');

  const ts = [
    `import type { CricketPlayer } from '../types';`,
    ``,
    `// Auto-generated by \`npm run seed\` on ${new Date().toISOString()}`,
    `// Stats baseline: src/data/players.ts (edit manually then re-run seed)`,
    `// Metadata (IPL teams, roles): Wikidata SPARQL`,
    `// World Cup winners: scripts/lib/worldcup.ts`,
    ``,
    `export const PLAYERS: CricketPlayer[] = ${JSON.stringify(enriched, null, 2)};`,
  ].join('\n');

  const outFile = path.join(process.cwd(), 'src/data/players.ts');
  await fs.writeFile(outFile, ts);

  console.log(`\n✅  Done — ${enriched.length} players written to src/data/players.ts`);
  console.log('   Wikidata IPL data enriched existing entries and added new players.');
  console.log('   Stats (runs/wickets) remain from the curated baseline.\n');
  console.log('   To update stats: edit src/data/players.ts directly, then re-run seed.\n');

  // Summary
  const byTeam: Record<string, number> = {};
  for (const p of enriched) { const t = p.teams[0]; byTeam[t] = (byTeam[t] ?? 0) + 1; }
  console.log('  Players per team:');
  for (const [t, n] of Object.entries(byTeam).sort((a, b) => b[1] - a[1]))
    console.log(`    ${t.padEnd(14)} ${n}`);
  console.log();
}

main().catch(err => { console.error('\n❌  Seeder failed:', err); process.exit(1); });

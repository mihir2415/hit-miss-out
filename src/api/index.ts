/**
 * API layer — all mocked locally.
 * Swap these implementations for real fetch() calls when the backend is ready.
 */
import { PLAYERS } from '../data/players';
import type { CricketPlayer, ValidationResult } from '../types';

// ── Validators ─────────────────────────────────────────────────────────────

function satisfiesCategory(player: CricketPlayer, categoryId: string): boolean {
  switch (categoryId) {
    // ── International teams ────────────────────────────────────────────────
    case 'india':          return player.teams.includes('India');
    case 'australia':      return player.teams.includes('Australia');
    case 'england':        return player.teams.includes('England');
    case 'pakistan':       return player.teams.includes('Pakistan');
    case 'west-indies':    return player.teams.includes('West Indies');
    case 'south-africa':   return player.teams.includes('South Africa');
    case 'new-zealand':    return player.teams.includes('New Zealand');
    case 'sri-lanka':      return player.teams.includes('Sri Lanka');

    // ── IPL franchises ─────────────────────────────────────────────────────
    case 'ipl-mi':   return player.iplTeams.includes('Mumbai Indians');
    case 'ipl-csk':  return player.iplTeams.includes('Chennai Super Kings');
    case 'ipl-rcb':  return player.iplTeams.includes('Royal Challengers Bangalore');
    case 'ipl-kkr':  return player.iplTeams.includes('Kolkata Knight Riders');
    case 'ipl-dc':   return player.iplTeams.includes('Delhi Capitals');
    case 'ipl-rr':   return player.iplTeams.includes('Rajasthan Royals');
    case 'ipl-pbks': return player.iplTeams.includes('Punjab Kings');
    case 'ipl-srh':  return player.iplTeams.includes('Sunrisers Hyderabad');
    case 'ipl-lsg':  return player.iplTeams.includes('Lucknow Super Giants');
    case 'ipl-gt':   return player.iplTeams.includes('Gujarat Titans');

    // ── TODO: re-enable when career stats data is available ────────────────
    // case '7k-test-runs':        return player.testRuns >= 7000;
    // case '10k-test-runs':       return player.testRuns >= 10000;
    // case '300-intl-wickets':    return (player.testWickets + player.odiWickets + player.t20iWickets) >= 300;
    // case '10-test-centuries':   return player.testCenturies >= 10;
    // case 'national-captain':    return player.captainedNational;
    // case 'allrounder':          return player.isAllrounder;
    // case 'ipl-player':          return player.iplTeams.length > 0;
    // case 'world-cup-winner':    return player.worldCupWins.length > 0;

    default: return false;
  }
}

// ── Fuzzy name matching ────────────────────────────────────────────────────

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

function matchScore(player: CricketPlayer, query: string): number {
  const q = normalise(query);
  if (!q) return 0;
  const names = [player.name, ...player.aliases].map(normalise);
  for (const n of names) {
    if (n === q) return 100;
    if (n.startsWith(q)) return 85;
    if (n.includes(q)) return 60;
    const words = n.split(' ');
    if (words.some(w => w.startsWith(q))) return 70;
  }
  return 0;
}

// ── Rarity calculation ─────────────────────────────────────────────────────

function calcRarity(rowId: string, colId: string): number {
  const valid = PLAYERS.filter(p => satisfiesCategory(p, rowId) && satisfiesCategory(p, colId));
  const total = PLAYERS.filter(p => satisfiesCategory(p, rowId));
  if (total.length === 0) return 100;
  const ratio = valid.length / total.length;
  // Invert so fewer answers = higher rarity score (shown as %)
  return Math.round((1 - ratio) * 100);
}

// ── Public API ────────────────────────────────────────────────────────────

export async function validateAnswer(
  rowCategoryId: string,
  colCategoryId: string,
  playerName: string,
): Promise<ValidationResult> {
  await new Promise(r => setTimeout(r, 120)); // simulate network

  const q = normalise(playerName);
  if (!q) return { valid: false, message: 'Enter a player name' };

  const scored = PLAYERS
    .map(p => ({ player: p, score: matchScore(p, playerName) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { valid: false, message: `"${playerName}" not found in our database` };

  const best = scored[0].player;
  const rowOk = satisfiesCategory(best, rowCategoryId);
  const colOk = satisfiesCategory(best, colCategoryId);

  if (!rowOk || !colOk) {
    return {
      valid: false,
      player: best,
      message: `${best.name} doesn't satisfy both criteria`,
    };
  }

  return {
    valid: true,
    player: best,
    rarityPct: calcRarity(rowCategoryId, colCategoryId),
    message: `${best.name} ✓`,
  };
}

export async function searchPlayers(query: string): Promise<CricketPlayer[]> {
  if (!query.trim()) return [];
  return PLAYERS
    .map(p => ({ player: p, score: matchScore(p, query) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(x => x.player);
}

export { satisfiesCategory };

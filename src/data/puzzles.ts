import type { Category } from '../types';

export const ALL_CATEGORIES: Record<string, Category> = {
  // Team categories
  india: { id: 'india', label: 'India', shortLabel: 'India', emoji: '🇮🇳', type: 'team', description: 'Played for India' },
  australia: { id: 'australia', label: 'Australia', shortLabel: 'Aus', emoji: '🇦🇺', type: 'team', description: 'Played for Australia' },
  england: { id: 'england', label: 'England', shortLabel: 'Eng', emoji: '🏴', type: 'team', description: 'Played for England' },
  pakistan: { id: 'pakistan', label: 'Pakistan', shortLabel: 'Pak', emoji: '🇵🇰', type: 'team', description: 'Played for Pakistan' },
  'west-indies': { id: 'west-indies', label: 'West Indies', shortLabel: 'WI', emoji: '🏝️', type: 'team', description: 'Played for West Indies' },
  'south-africa': { id: 'south-africa', label: 'South Africa', shortLabel: 'SA', emoji: '🇿🇦', type: 'team', description: 'Played for South Africa' },
  'new-zealand': { id: 'new-zealand', label: 'New Zealand', shortLabel: 'NZ', emoji: '🇳🇿', type: 'team', description: 'Played for New Zealand' },
  'sri-lanka': { id: 'sri-lanka', label: 'Sri Lanka', shortLabel: 'SL', emoji: '🇱🇰', type: 'team', description: 'Played for Sri Lanka' },

  // Stat categories
  '7k-test-runs': { id: '7k-test-runs', label: '7,000+ Test Runs', shortLabel: '7k+ Runs', emoji: '🏏', type: 'stat', description: 'Scored 7,000 or more Test runs' },
  '10k-test-runs': { id: '10k-test-runs', label: '10,000+ Test Runs', shortLabel: '10k+ Runs', emoji: '🏏', type: 'stat', description: 'Scored 10,000 or more Test runs' },
  '300-intl-wickets': { id: '300-intl-wickets', label: '300+ Intl. Wickets', shortLabel: '300+ Wkts', emoji: '🎯', type: 'stat', description: '300 or more international wickets (Test + ODI)' },
  '10-test-centuries': { id: '10-test-centuries', label: '10+ Test Centuries', shortLabel: '10+ 100s', emoji: '💯', type: 'stat', description: 'Scored 10 or more Test centuries' },
  'national-captain': { id: 'national-captain', label: 'National Captain', shortLabel: 'Captain', emoji: '🎖️', type: 'stat', description: 'Captained their national team' },
  allrounder: { id: 'allrounder', label: 'All-Rounder', shortLabel: 'All-Rndr', emoji: '⭐', type: 'stat', description: 'Recognised as a genuine all-rounder' },
  'ipl-player': { id: 'ipl-player', label: 'IPL Player', shortLabel: 'IPL', emoji: '🔥', type: 'stat', description: 'Has played in the Indian Premier League' },
  'world-cup-winner': { id: 'world-cup-winner', label: 'World Cup Winner', shortLabel: 'WC Winner', emoji: '🏆', type: 'trophy', description: 'Won the ICC Cricket World Cup (ODI)' },
};

interface PuzzleDef {
  id: string;
  rows: [string, string, string];
  cols: [string, string, string];
}

export const PUZZLES: PuzzleDef[] = [
  { id: 'p1',  rows: ['india', 'australia', 'england'],      cols: ['7k-test-runs', 'world-cup-winner', 'national-captain'] },
  { id: 'p2',  rows: ['west-indies', 'south-africa', 'new-zealand'], cols: ['allrounder', '300-intl-wickets', '10-test-centuries'] },
  { id: 'p3',  rows: ['india', 'pakistan', 'sri-lanka'],     cols: ['world-cup-winner', 'allrounder', 'national-captain'] },
  { id: 'p4',  rows: ['australia', 'england', 'south-africa'], cols: ['10k-test-runs', '300-intl-wickets', 'ipl-player'] },
  { id: 'p5',  rows: ['india', 'west-indies', 'sri-lanka'],  cols: ['10k-test-runs', '10-test-centuries', 'national-captain'] },
  { id: 'p6',  rows: ['pakistan', 'australia', 'england'],   cols: ['world-cup-winner', 'allrounder', '300-intl-wickets'] },
  { id: 'p7',  rows: ['india', 'south-africa', 'new-zealand'], cols: ['national-captain', 'allrounder', 'ipl-player'] },
  { id: 'p8',  rows: ['west-indies', 'pakistan', 'sri-lanka'], cols: ['10-test-centuries', 'world-cup-winner', 'national-captain'] },
  { id: 'p9',  rows: ['australia', 'india', 'new-zealand'],  cols: ['world-cup-winner', '7k-test-runs', '300-intl-wickets'] },
  { id: 'p10', rows: ['england', 'south-africa', 'sri-lanka'], cols: ['10-test-centuries', 'national-captain', 'allrounder'] },
  { id: 'p11', rows: ['india', 'australia', 'west-indies'],  cols: ['allrounder', 'ipl-player', 'world-cup-winner'] },
  { id: 'p12', rows: ['pakistan', 'new-zealand', 'england'], cols: ['national-captain', '7k-test-runs', 'allrounder'] },
];

export function getPuzzleConfig(puzzleId: string) {
  const def = PUZZLES.find(p => p.id === puzzleId) ?? PUZZLES[0];
  return {
    puzzleId: def.id,
    rowCategories: def.rows.map(id => ALL_CATEGORIES[id]) as [Category, Category, Category],
    colCategories: def.cols.map(id => ALL_CATEGORIES[id]) as [Category, Category, Category],
    stealsEnabled: true,
    turnSeconds: 30,
  };
}

export function getRandomPuzzleId(): string {
  return PUZZLES[Math.floor(Math.random() * PUZZLES.length)].id;
}

export function getDailyPuzzleId(): string {
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return PUZZLES[dayIndex % PUZZLES.length].id;
}

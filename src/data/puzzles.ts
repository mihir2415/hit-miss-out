import type { Category } from '../types';

export const ALL_CATEGORIES: Record<string, Category> = {
  // ── International teams ──────────────────────────────────────────────────
  india:         { id: 'india',         label: 'India',        shortLabel: 'India', emoji: '🇮🇳', type: 'team', description: 'Played for India' },
  australia:     { id: 'australia',     label: 'Australia',    shortLabel: 'Aus',   emoji: '🇦🇺', type: 'team', description: 'Played for Australia' },
  england:       { id: 'england',       label: 'England',      shortLabel: 'Eng',   emoji: '🏴', type: 'team', description: 'Played for England' },
  pakistan:      { id: 'pakistan',      label: 'Pakistan',     shortLabel: 'Pak',   emoji: '🇵🇰', type: 'team', description: 'Played for Pakistan' },
  'west-indies': { id: 'west-indies',   label: 'West Indies',  shortLabel: 'WI',    emoji: '🏝️', type: 'team', description: 'Played for West Indies' },
  'south-africa':{ id: 'south-africa',  label: 'South Africa', shortLabel: 'SA',    emoji: '🇿🇦', type: 'team', description: 'Played for South Africa' },
  'new-zealand': { id: 'new-zealand',   label: 'New Zealand',  shortLabel: 'NZ',    emoji: '🇳🇿', type: 'team', description: 'Played for New Zealand' },
  'sri-lanka':   { id: 'sri-lanka',     label: 'Sri Lanka',    shortLabel: 'SL',    emoji: '🇱🇰', type: 'team', description: 'Played for Sri Lanka' },

  // ── IPL franchises ───────────────────────────────────────────────────────
  'ipl-mi':  { id: 'ipl-mi',  label: 'Mumbai Indians',          shortLabel: 'MI',   emoji: '💙', type: 'team', description: 'Played for Mumbai Indians' },
  'ipl-csk': { id: 'ipl-csk', label: 'Chennai Super Kings',     shortLabel: 'CSK',  emoji: '💛', type: 'team', description: 'Played for Chennai Super Kings' },
  'ipl-rcb': { id: 'ipl-rcb', label: 'Royal Challengers Bangalore', shortLabel: 'RCB', emoji: '❤️', type: 'team', description: 'Played for Royal Challengers Bangalore' },
  'ipl-kkr': { id: 'ipl-kkr', label: 'Kolkata Knight Riders',   shortLabel: 'KKR',  emoji: '💜', type: 'team', description: 'Played for Kolkata Knight Riders' },
  'ipl-dc':  { id: 'ipl-dc',  label: 'Delhi Capitals',          shortLabel: 'DC',   emoji: '🔵', type: 'team', description: 'Played for Delhi Capitals' },
  'ipl-rr':  { id: 'ipl-rr',  label: 'Rajasthan Royals',        shortLabel: 'RR',   emoji: '🩷', type: 'team', description: 'Played for Rajasthan Royals' },
  'ipl-pbks':{ id: 'ipl-pbks',label: 'Punjab Kings',            shortLabel: 'PBKS', emoji: '🔴', type: 'team', description: 'Played for Punjab Kings' },
  'ipl-srh': { id: 'ipl-srh', label: 'Sunrisers Hyderabad',     shortLabel: 'SRH',  emoji: '🟠', type: 'team', description: 'Played for Sunrisers Hyderabad' },
  'ipl-lsg': { id: 'ipl-lsg', label: 'Lucknow Super Giants',    shortLabel: 'LSG',  emoji: '🩵', type: 'team', description: 'Played for Lucknow Super Giants' },
  'ipl-gt':  { id: 'ipl-gt',  label: 'Gujarat Titans',          shortLabel: 'GT',   emoji: '🔷', type: 'team', description: 'Played for Gujarat Titans' },

  // ── TODO: re-enable when career stats data is available ─────────────────
  // '7k-test-runs':       { id: '7k-test-runs',       label: '7,000+ Test Runs',      shortLabel: '7k+ Runs',  emoji: '🏏', type: 'stat', description: 'Scored 7,000 or more Test runs' },
  // '10k-test-runs':      { id: '10k-test-runs',      label: '10,000+ Test Runs',     shortLabel: '10k+ Runs', emoji: '🏏', type: 'stat', description: 'Scored 10,000 or more Test runs' },
  // '300-intl-wickets':   { id: '300-intl-wickets',   label: '300+ Intl. Wickets',    shortLabel: '300+ Wkts', emoji: '🎯', type: 'stat', description: '300 or more international wickets (Test + ODI)' },
  // '10-test-centuries':  { id: '10-test-centuries',  label: '10+ Test Centuries',    shortLabel: '10+ 100s',  emoji: '💯', type: 'stat', description: 'Scored 10 or more Test centuries' },
  // 'national-captain':   { id: 'national-captain',   label: 'National Captain',      shortLabel: 'Captain',   emoji: '🎖️', type: 'stat', description: 'Captained their national team' },
  // allrounder:           { id: 'allrounder',          label: 'All-Rounder',           shortLabel: 'All-Rndr',  emoji: '⭐', type: 'stat', description: 'Recognised as a genuine all-rounder' },
  // 'world-cup-winner':   { id: 'world-cup-winner',   label: 'World Cup Winner',      shortLabel: 'WC Winner', emoji: '🏆', type: 'trophy', description: 'Won the ICC Cricket World Cup (ODI)' },
};

interface PuzzleDef {
  id: string;
  rows: [string, string, string];
  cols: [string, string, string];
}

// Rows: international teams   Cols: IPL franchises
export const PUZZLES: PuzzleDef[] = [
  { id: 'p1',  rows: ['india',         'australia',   'england'],       cols: ['ipl-mi',  'ipl-csk',  'ipl-rcb']  },
  { id: 'p2',  rows: ['india',         'south-africa','west-indies'],   cols: ['ipl-kkr', 'ipl-rr',   'ipl-pbks'] },
  { id: 'p3',  rows: ['india',         'australia',   'new-zealand'],   cols: ['ipl-mi',  'ipl-kkr',  'ipl-dc']   },
  { id: 'p4',  rows: ['india',         'england',     'south-africa'],  cols: ['ipl-rcb', 'ipl-srh',  'ipl-rr']   },
  { id: 'p5',  rows: ['india',         'australia',   'sri-lanka'],     cols: ['ipl-csk', 'ipl-pbks', 'ipl-srh']  },
  { id: 'p6',  rows: ['india',         'pakistan',    'west-indies'],   cols: ['ipl-mi',  'ipl-rcb',  'ipl-kkr']  },
  { id: 'p7',  rows: ['australia',     'england',     'south-africa'],  cols: ['ipl-mi',  'ipl-rr',   'ipl-srh']  },
  { id: 'p8',  rows: ['australia',     'new-zealand', 'west-indies'],   cols: ['ipl-csk', 'ipl-kkr',  'ipl-rcb']  },
  { id: 'p9',  rows: ['england',       'south-africa','new-zealand'],   cols: ['ipl-mi',  'ipl-dc',   'ipl-pbks'] },
  { id: 'p10', rows: ['india',         'sri-lanka',   'pakistan'],      cols: ['ipl-lsg', 'ipl-gt',   'ipl-dc']   },
  { id: 'p11', rows: ['australia',     'england',     'west-indies'],   cols: ['ipl-rr',  'ipl-pbks', 'ipl-lsg']  },
  { id: 'p12', rows: ['south-africa',  'new-zealand', 'sri-lanka'],     cols: ['ipl-mi',  'ipl-csk',  'ipl-rcb']  },
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

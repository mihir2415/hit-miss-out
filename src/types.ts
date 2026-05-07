export type Player = 'X' | 'O';
export type GamePhase = 'setup' | 'playing' | 'won' | 'draw';
export type CategoryType = 'team' | 'stat' | 'trophy';

export interface CellState {
  owner: Player;
  answer: string;
  isStolen: boolean;
  rarityPct?: number;
}

export interface Category {
  id: string;
  label: string;
  shortLabel: string;
  emoji: string;
  type: CategoryType;
  description: string;
}

export interface GameConfig {
  rowCategories: [Category, Category, Category];
  colCategories: [Category, Category, Category];
  stealsEnabled: boolean;
  turnSeconds: number;
  puzzleId: string;
}

export interface GameState {
  grid: (CellState | null)[][];
  currentPlayer: Player;
  stealsLeft: Record<Player, number>;
  phase: GamePhase;
  winner: Player | null;
  winLine: [number, number][] | null;
  playerNames: Record<Player, string>;
  config: GameConfig;
  pendingCell: { row: number; col: number; isSteal: boolean } | null;
  flashCell: { row: number; col: number; result: 'hit' | 'miss' | 'steal' } | null;
}

export interface CricketPlayer {
  id: string;
  name: string;
  aliases: string[];
  teams: string[];
  testRuns: number;
  testWickets: number;
  odiWickets: number;
  t20iWickets: number;
  testCenturies: number;
  worldCupWins: string[];
  iplTeams: string[];
  captainedNational: boolean;
  isAllrounder: boolean;
}

export interface ValidationResult {
  valid: boolean;
  player?: CricketPlayer;
  rarityPct?: number;
  message: string;
}

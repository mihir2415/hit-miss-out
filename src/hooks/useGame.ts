import { useCallback, useReducer } from 'react';
import type { GameState, Player, CellState, GameConfig } from '../types';
import { validateAnswer } from '../api';

const INITIAL_STEALS = 3;

function makeGrid(): (CellState | null)[][] {
  return Array(3).fill(null).map(() => Array(3).fill(null));
}

function checkWin(grid: (CellState | null)[][]): { winner: Player; line: [number, number][] } | null {
  const lines: [number, number][][] = [
    [[0,0],[0,1],[0,2]], [[1,0],[1,1],[1,2]], [[2,0],[2,1],[2,2]],
    [[0,0],[1,0],[2,0]], [[0,1],[1,1],[2,1]], [[0,2],[1,2],[2,2]],
    [[0,0],[1,1],[2,2]], [[0,2],[1,1],[2,0]],
  ];
  for (const line of lines) {
    const cells = line.map(([r, c]) => grid[r][c]);
    if (cells.every(cell => cell?.owner === 'X')) return { winner: 'X', line: line as [number, number][] };
    if (cells.every(cell => cell?.owner === 'O')) return { winner: 'O', line: line as [number, number][] };
  }
  return null;
}

function isDraw(grid: (CellState | null)[][]): boolean {
  return grid.every(row => row.every(cell => cell !== null));
}

type Action =
  | { type: 'START'; config: GameConfig; playerNames: Record<Player, string> }
  | { type: 'OPEN_CELL'; row: number; col: number; isSteal: boolean }
  | { type: 'CANCEL_SEARCH' }
  | { type: 'CLAIM_CELL'; row: number; col: number; answer: string; isSteal: boolean; rarityPct?: number }
  | { type: 'MISS'; row: number; col: number }
  | { type: 'TIMEOUT' }
  | { type: 'CLEAR_FLASH' }
  | { type: 'RESET' }
  | { type: 'NEW_PUZZLE'; config: GameConfig };

function nextPlayer(p: Player): Player { return p === 'X' ? 'O' : 'X'; }

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        grid: makeGrid(),
        currentPlayer: 'X',
        stealsLeft: { X: INITIAL_STEALS, O: INITIAL_STEALS },
        phase: 'playing',
        winner: null,
        winLine: null,
        playerNames: action.playerNames,
        config: action.config,
        pendingCell: null,
        flashCell: null,
      };

    case 'OPEN_CELL':
      if (state.phase !== 'playing') return state;
      return { ...state, pendingCell: { row: action.row, col: action.col, isSteal: action.isSteal } };

    case 'CANCEL_SEARCH':
      return { ...state, pendingCell: null };

    case 'CLAIM_CELL': {
      const { row, col, answer, isSteal, rarityPct } = action;
      const newGrid = state.grid.map(r => [...r]);
      newGrid[row][col] = {
        owner: state.currentPlayer,
        answer,
        isStolen: isSteal,
        rarityPct,
      };
      const winResult = checkWin(newGrid);
      const draw = !winResult && isDraw(newGrid);
      const stealsLeft = isSteal
        ? { ...state.stealsLeft, [state.currentPlayer]: state.stealsLeft[state.currentPlayer] - 1 }
        : state.stealsLeft;
      return {
        ...state,
        grid: newGrid,
        stealsLeft,
        currentPlayer: nextPlayer(state.currentPlayer),
        phase: winResult ? 'won' : draw ? 'draw' : 'playing',
        winner: winResult ? winResult.winner : null,
        winLine: winResult ? winResult.line : null,
        pendingCell: null,
        flashCell: { row, col, result: isSteal ? 'steal' : 'hit' },
      };
    }

    case 'MISS': {
      const { row, col } = action;
      return {
        ...state,
        currentPlayer: nextPlayer(state.currentPlayer),
        pendingCell: null,
        flashCell: { row, col, result: 'miss' },
      };
    }

    case 'TIMEOUT':
      return {
        ...state,
        currentPlayer: nextPlayer(state.currentPlayer),
        pendingCell: null,
        flashCell: null,
      };

    case 'CLEAR_FLASH':
      return { ...state, flashCell: null };

    case 'RESET':
      return {
        ...state,
        grid: makeGrid(),
        currentPlayer: 'X',
        stealsLeft: { X: INITIAL_STEALS, O: INITIAL_STEALS },
        phase: 'playing',
        winner: null,
        winLine: null,
        pendingCell: null,
        flashCell: null,
      };

    case 'NEW_PUZZLE':
      return {
        ...state,
        grid: makeGrid(),
        currentPlayer: 'X',
        stealsLeft: { X: INITIAL_STEALS, O: INITIAL_STEALS },
        phase: 'playing',
        winner: null,
        winLine: null,
        config: action.config,
        pendingCell: null,
        flashCell: null,
      };

    default:
      return state;
  }
}

const PLACEHOLDER_CONFIG: GameConfig = {
  puzzleId: '',
  rowCategories: [
    { id: '', label: '', shortLabel: '', emoji: '', type: 'team', description: '' },
    { id: '', label: '', shortLabel: '', emoji: '', type: 'team', description: '' },
    { id: '', label: '', shortLabel: '', emoji: '', type: 'team', description: '' },
  ],
  colCategories: [
    { id: '', label: '', shortLabel: '', emoji: '', type: 'stat', description: '' },
    { id: '', label: '', shortLabel: '', emoji: '', type: 'stat', description: '' },
    { id: '', label: '', shortLabel: '', emoji: '', type: 'stat', description: '' },
  ],
  stealsEnabled: true,
  turnSeconds: 30,
};

export function useGame() {
  const [state, dispatch] = useReducer(reducer, {
    grid: makeGrid(),
    currentPlayer: 'X',
    stealsLeft: { X: INITIAL_STEALS, O: INITIAL_STEALS },
    phase: 'setup',
    winner: null,
    winLine: null,
    playerNames: { X: 'Player 1', O: 'Player 2' },
    config: PLACEHOLDER_CONFIG,
    pendingCell: null,
    flashCell: null,
  });

  const startGame = useCallback(
    (playerNames: Record<Player, string>, config: GameConfig) =>
      dispatch({ type: 'START', config, playerNames }),
    [],
  );

  const openCell = useCallback((row: number, col: number, isSteal: boolean) => {
    dispatch({ type: 'OPEN_CELL', row, col, isSteal });
  }, []);

  const cancelSearch = useCallback(() => dispatch({ type: 'CANCEL_SEARCH' }), []);

  const submitAnswer = useCallback(
    async (playerName: string) => {
      if (!state.pendingCell) return;
      const { row, col, isSteal } = state.pendingCell;
      const { config } = state;
      const result = await validateAnswer(
        config.rowCategories[row].id,
        config.colCategories[col].id,
        playerName,
      );
      if (result.valid) {
        dispatch({
          type: 'CLAIM_CELL',
          row, col,
          answer: result.player?.name ?? playerName,
          isSteal,
          rarityPct: result.rarityPct,
        });
      } else {
        dispatch({ type: 'MISS', row, col });
      }
      return result;
    },
    [state.pendingCell, state.config],
  );

  const handleTimeout = useCallback(() => dispatch({ type: 'TIMEOUT' }), []);
  const clearFlash = useCallback(() => dispatch({ type: 'CLEAR_FLASH' }), []);
  const resetGame = useCallback(() => dispatch({ type: 'RESET' }), []);
  const newPuzzle = useCallback(
    (config: GameConfig) => dispatch({ type: 'NEW_PUZZLE', config }),
    [],
  );

  return { state, startGame, openCell, cancelSearch, submitAnswer, handleTimeout, clearFlash, resetGame, newPuzzle };
}

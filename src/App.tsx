import { useEffect } from 'react';
import type { Player, GameConfig } from './types';
import { useGame } from './hooks/useGame';
import { useTimer } from './hooks/useTimer';
import { StartScreen } from './components/StartScreen';
import { GameBoard } from './components/GameBoard';
import { TurnBanner } from './components/TurnBanner';
import { PlayerSearch } from './components/PlayerSearch';
import { WinModal } from './components/WinModal';

export default function App() {
  const {
    state,
    startGame,
    openCell,
    cancelSearch,
    submitAnswer,
    handleTimeout,
    clearFlash,
    resetGame,
    newPuzzle,
  } = useGame();

  const timerActive =
    state.phase === 'playing' && state.pendingCell === null;

  const { remaining, reset: resetTimer } = useTimer(
    state.config.turnSeconds,
    handleTimeout,
    timerActive,
  );

  // Reset timer whenever the current player changes
  useEffect(() => {
    resetTimer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentPlayer]);

  function handleCellClick(row: number, col: number) {
    const cell = state.grid[row][col];
    const isSteal =
      cell !== null &&
      cell.owner !== state.currentPlayer &&
      state.config.stealsEnabled &&
      state.stealsLeft[state.currentPlayer] > 0;
    openCell(row, col, isSteal);
  }

  function handleStart(playerNames: Record<Player, string>, config: GameConfig) {
    startGame(playerNames, config);
  }

  function handleNewPuzzle(config: GameConfig) {
    newPuzzle(config);
  }

  if (state.phase === 'setup') {
    return <StartScreen onStart={handleStart} />;
  }

  return (
    <div className="min-h-screen bg-pitch-deep flex flex-col items-center px-3 py-4 sm:py-8">
      {/* Header */}
      <div className="w-full max-w-[520px] mb-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-black text-cream tracking-tight">
            🏏 <span className="text-playerX">HIT</span>{' '}
            <span className="text-cream/50">MISS</span>{' '}
            <span className="text-gold">OUT</span>
          </h1>
          <button
            onClick={resetGame}
            className="text-cream/40 hover:text-cream/70 text-xs font-semibold border border-pitch-border hover:border-pitch-light rounded-lg px-3 py-1.5 transition"
          >
            New Game
          </button>
        </div>

        <TurnBanner state={state} remaining={remaining} />
      </div>

      {/* Board */}
      <GameBoard
        state={state}
        onCellClick={handleCellClick}
        onClearFlash={clearFlash}
      />

      {/* Footer hint */}
      {state.phase === 'playing' && (
        <p className="mt-4 text-center text-cream/30 text-xs max-w-xs">
          Tap an empty cell and name a cricketer who matches both row and column
          {state.config.stealsEnabled ? ' · tap an opponent’s cell to steal ⚡' : ''}
        </p>
      )}

      {/* Search modal */}
      {state.pendingCell && (
        <PlayerSearch
          rowCategory={state.config.rowCategories[state.pendingCell.row]}
          colCategory={state.config.colCategories[state.pendingCell.col]}
          isSteal={state.pendingCell.isSteal}
          onSubmit={submitAnswer}
          onCancel={cancelSearch}
        />
      )}

      {/* Win / draw modal */}
      {(state.phase === 'won' || state.phase === 'draw') && (
        <WinModal
          state={state}
          onPlayAgain={resetGame}
          onNewPuzzle={handleNewPuzzle}
        />
      )}
    </div>
  );
}

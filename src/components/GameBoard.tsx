import type { GameState } from '../types';
import { Cell } from './Cell';

interface Props {
  state: GameState;
  onCellClick: (row: number, col: number) => void;
  onClearFlash: () => void;
}

export function GameBoard({ state, onCellClick, onClearFlash }: Props) {
  const { grid, currentPlayer, stealsLeft, config, pendingCell, flashCell, winLine, phase } = state;

  function handleCellClick(row: number, col: number) {
    if (phase !== 'playing') return;
    onCellClick(row, col);
  }

  return (
    <div className="w-full max-w-[520px] mx-auto">
      {/* 4×4 grid: top-left corner empty, then 3 col headers, then 3 rows */}
      <div
        className="grid gap-1.5 sm:gap-2"
        style={{ gridTemplateColumns: 'minmax(60px,80px) 1fr 1fr 1fr' }}
      >
        {/* Corner */}
        <div className="flex items-center justify-center">
          <span className="text-2xl">🏏</span>
        </div>

        {/* Column headers */}
        {config.colCategories.map(cat => (
          <div
            key={cat.id}
            className="flex flex-col items-center justify-center text-center bg-pitch-mid border border-pitch-border rounded-xl px-1 py-2 gap-0.5"
          >
            <span className="text-xl sm:text-2xl">{cat.emoji}</span>
            <span className="text-cream text-[9px] sm:text-[11px] font-bold leading-tight">
              {cat.shortLabel}
            </span>
          </div>
        ))}

        {/* Rows */}
        {config.rowCategories.map((rowCat, row) => (
          <>
            {/* Row label */}
            <div
              key={rowCat.id}
              className="flex flex-col items-center justify-center text-center bg-pitch-mid border border-pitch-border rounded-xl px-1 py-2 gap-0.5"
            >
              <span className="text-xl sm:text-2xl">{rowCat.emoji}</span>
              <span className="text-cream text-[9px] sm:text-[11px] font-bold leading-tight">
                {rowCat.shortLabel}
              </span>
            </div>

            {/* 3 cells */}
            {config.colCategories.map((_colCat, col) => {
              const isWinLine = winLine?.some(([r, c]) => r === row && c === col) ?? false;
              const pendingHere = pendingCell?.row === row && pendingCell?.col === col;
              const flash =
                flashCell?.row === row && flashCell?.col === col ? flashCell.result : null;
              const cell = grid[row][col];
              const canSteal =
                cell !== null &&
                cell.owner !== currentPlayer &&
                config.stealsEnabled &&
                stealsLeft[currentPlayer] > 0;

              return (
                <Cell
                  key={`${row}-${col}`}
                  cell={cell}
                  row={row}
                  col={col}
                  currentPlayer={currentPlayer}
                  stealsEnabled={config.stealsEnabled}
                  stealsLeft={stealsLeft[currentPlayer]}
                  pendingHere={pendingHere}
                  flash={flash}
                  isWinLine={isWinLine}
                  onClearFlash={onClearFlash}
                  onClick={() => {
                    if (phase !== 'playing') return;
                    if (cell === null) {
                      handleCellClick(row, col);
                    } else if (canSteal) {
                      handleCellClick(row, col);
                    }
                  }}
                />
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

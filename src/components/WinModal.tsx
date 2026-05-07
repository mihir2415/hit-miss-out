import { useEffect, useState } from 'react';
import type { GameState, Player } from '../types';
import { getPuzzleConfig, getRandomPuzzleId } from '../data/puzzles';
import type { GameConfig } from '../types';

interface Props {
  state: GameState;
  onPlayAgain: () => void;
  onNewPuzzle: (config: GameConfig) => void;
}

interface Confetto {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
}

const CONFETTI_COLORS = ['#e84545', '#4a9eff', '#f0c040', '#a8e063', '#ff9f43', '#a29bfe'];

function useConfetti(active: boolean) {
  const [pieces, setPieces] = useState<Confetto[]>([]);
  useEffect(() => {
    if (!active) return;
    setPieces(
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 8,
        delay: Math.random() * 0.8,
        duration: 1.8 + Math.random() * 1.2,
      })),
    );
  }, [active]);
  return pieces;
}

export function WinModal({ state, onPlayAgain, onNewPuzzle }: Props) {
  const { phase, winner, playerNames, grid, config } = state;
  const isWin = phase === 'won';
  const pieces = useConfetti(isWin);

  const xCells = grid.flat().filter(c => c?.owner === 'X').length;
  const oCells = grid.flat().filter(c => c?.owner === 'O').length;

  function playerColor(p: Player) {
    return p === 'X' ? 'text-playerX' : 'text-playerO';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Confetti */}
      {pieces.map(p => (
        <span
          key={p.id}
          className="absolute top-0 rounded-sm pointer-events-none"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 0.5,
            background: p.color,
            animationName: 'confettiFall',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            animationFillMode: 'forwards',
            animationTimingFunction: 'linear',
          }}
        />
      ))}

      <div className="w-full max-w-sm bg-pitch-mid border border-pitch-border rounded-2xl shadow-2xl p-7 text-center animate-slide-up mx-4">
        {isWin ? (
          <>
            <div className="text-5xl mb-2">🏆</div>
            <h2 className="text-3xl font-black text-gold mb-1">
              {playerNames[winner!]} wins!
            </h2>
            <p className={`text-lg font-bold mb-4 ${playerColor(winner!)}`}>
              {winner} dominates the crease
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-2">🤝</div>
            <h2 className="text-3xl font-black text-cream mb-1">It's a Draw!</h2>
            <p className="text-cream/50 text-sm mb-4">Both players fought hard</p>
          </>
        )}

        {/* Score breakdown */}
        <div className="flex gap-3 mb-6">
          {(['X', 'O'] as Player[]).map(p => (
            <div
              key={p}
              className={`flex-1 rounded-xl border py-3 px-2
                ${p === 'X' ? 'border-playerX/40 bg-playerX/10' : 'border-playerO/40 bg-playerO/10'}`}
            >
              <p className={`text-2xl font-black ${playerColor(p)}`}>{p === 'X' ? xCells : oCells}</p>
              <p className={`text-xs font-semibold mt-0.5 ${playerColor(p)}`}>{playerNames[p]}</p>
              <p className="text-cream/30 text-[10px]">{p === 'X' ? xCells : oCells} cell{(p === 'X' ? xCells : oCells) !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>

        {/* All answers */}
        <div className="bg-pitch-light rounded-xl p-3 mb-6 text-left">
          <p className="text-cream/40 text-[10px] uppercase tracking-wider font-bold mb-2">All Answers</p>
          <div className="space-y-1">
            {grid.flatMap((row, r) =>
              row.map((cell, c) =>
                cell ? (
                  <div key={`${r}-${c}`} className="flex items-center gap-2 text-xs">
                    <span className={`font-bold w-4 ${playerColor(cell.owner)}`}>{cell.owner}</span>
                    <span className="text-cream/60 truncate">{cell.answer}</span>
                    <span className="ml-auto text-cream/30 text-[10px] shrink-0">
                      {config.rowCategories[r].emoji}×{config.colCategories[c].emoji}
                    </span>
                  </div>
                ) : null,
              ),
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 bg-pitch-light border border-pitch-border hover:border-cream/30 rounded-xl text-cream text-sm font-bold transition"
          >
            Same Puzzle
          </button>
          <button
            onClick={() => onNewPuzzle(getPuzzleConfig(getRandomPuzzleId()))}
            className="flex-1 py-3 bg-playerX hover:bg-red-500 rounded-xl text-white text-sm font-bold transition"
          >
            New Puzzle 🎲
          </button>
        </div>
      </div>
    </div>
  );
}

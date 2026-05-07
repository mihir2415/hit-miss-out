import { useState } from 'react';
import type { Player, GameConfig } from '../types';
import { getPuzzleConfig, getDailyPuzzleId, getRandomPuzzleId } from '../data/puzzles';

interface Props {
  onStart: (playerNames: Record<Player, string>, config: GameConfig) => void;
}

export function StartScreen({ onStart }: Props) {
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [steals, setSteals] = useState(true);
  const [mode, setMode] = useState<'daily' | 'random'>('daily');

  function handleStart() {
    const config = getPuzzleConfig(mode === 'daily' ? getDailyPuzzleId() : getRandomPuzzleId());
    config.stealsEnabled = steals;
    onStart(
      { X: name1.trim() || 'Player 1', O: name2.trim() || 'Player 2' },
      config,
    );
  }

  return (
    <div className="min-h-screen bg-pitch-deep flex flex-col items-center justify-center px-4 py-12 animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="text-7xl mb-3">🏏</div>
        <h1 className="text-5xl sm:text-6xl font-black text-cream tracking-tight leading-none">
          HIT MISS OUT
        </h1>
        <p className="text-pitch-border mt-3 text-sm font-medium tracking-widest uppercase">
          Cricket Knowledge · Tic-Tac-Toe
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-pitch-mid border border-pitch-border rounded-2xl p-7 shadow-2xl">
        {/* Player names */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-playerX uppercase tracking-wider mb-1.5">
              Player 1 (X — Red)
            </label>
            <input
              className="w-full bg-pitch-light border border-pitch-border rounded-xl px-4 py-3 text-cream placeholder-pitch-border outline-none focus:border-playerX focus:ring-1 focus:ring-playerX transition"
              placeholder="Enter name…"
              value={name1}
              onChange={e => setName1(e.target.value)}
              maxLength={20}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-playerO uppercase tracking-wider mb-1.5">
              Player 2 (O — Blue)
            </label>
            <input
              className="w-full bg-pitch-light border border-pitch-border rounded-xl px-4 py-3 text-cream placeholder-pitch-border outline-none focus:border-playerO focus:ring-1 focus:ring-playerO transition"
              placeholder="Enter name…"
              value={name2}
              onChange={e => setName2(e.target.value)}
              maxLength={20}
            />
          </div>
        </div>

        {/* Puzzle mode */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-cream/60 uppercase tracking-wider mb-2">Puzzle</p>
          <div className="grid grid-cols-2 gap-2">
            {(['daily', 'random'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition border
                  ${mode === m
                    ? 'bg-gold border-gold text-pitch-deep'
                    : 'bg-pitch-light border-pitch-border text-cream/70 hover:border-cream/40'}`}
              >
                {m === 'daily' ? '📅 Daily' : '🎲 Random'}
              </button>
            ))}
          </div>
        </div>

        {/* Steals toggle */}
        <div className="flex items-center justify-between mb-8 bg-pitch-light border border-pitch-border rounded-xl px-4 py-3">
          <div>
            <p className="text-cream text-sm font-semibold">⚡ Steal Mode</p>
            <p className="text-cream/50 text-xs">Each player gets 3 steals</p>
          </div>
          <button
            onClick={() => setSteals(s => !s)}
            className={`relative w-12 h-6 rounded-full transition-colors ${steals ? 'bg-gold' : 'bg-pitch-border'}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${steals ? 'translate-x-6' : 'translate-x-0.5'}`}
            />
          </button>
        </div>

        {/* Start */}
        <button
          onClick={handleStart}
          className="w-full py-4 bg-playerX hover:bg-red-500 text-white font-black text-lg rounded-xl tracking-wide transition active:scale-95"
        >
          START MATCH 🏏
        </button>
      </div>

      <p className="mt-8 text-pitch-border text-xs text-center max-w-xs">
        Name a cricketer who matches both the row <em>and</em> column criteria to claim a square.
      </p>
    </div>
  );
}

import type { Player, GameState } from '../types';

interface Props {
  state: GameState;
  remaining: number;
}

function TimerRing({ remaining, total }: { remaining: number; total: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const pct = remaining / total;
  const dash = circ * pct;
  const urgent = remaining <= 10;
  return (
    <svg width="44" height="44" className="-rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#2a5040" strokeWidth="3" />
      <circle
        cx="22" cy="22" r={r} fill="none"
        stroke={urgent ? '#e84545' : '#f0c040'}
        strokeWidth="3"
        strokeDasharray={`${dash} ${circ}`}
        className="transition-all duration-1000 ease-linear"
      />
      <text
        x="22" y="22"
        dominantBaseline="middle" textAnchor="middle"
        className="rotate-90"
        style={{ rotate: '90deg', transformOrigin: '22px 22px', fontSize: '10px', fontWeight: 700, fill: urgent ? '#e84545' : '#f0ece0' }}
        transform="rotate(90, 22, 22)"
      >
        {remaining}
      </text>
    </svg>
  );
}

function StealDots({ count, player }: { count: number; player: Player }) {
  const color = player === 'X' ? 'bg-playerX' : 'bg-playerO';
  return (
    <div className="flex gap-1 items-center">
      <span className="text-cream/40 text-xs mr-0.5">⚡</span>
      {Array.from({ length: 3 }).map((_, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full transition-all ${i < count ? color : 'bg-pitch-border'}`}
        />
      ))}
    </div>
  );
}

export function TurnBanner({ state, remaining }: Props) {
  const { currentPlayer, playerNames, stealsLeft, config, phase } = state;
  const isX = currentPlayer === 'X';
  const name = playerNames[currentPlayer];
  const color = isX ? 'text-playerX' : 'text-playerO';
  const bg = isX ? 'border-playerX/30 bg-playerX/10' : 'border-playerO/30 bg-playerO/10';

  return (
    <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${bg} mb-4`}>
      <div className="flex items-center gap-3">
        <span className={`text-2xl font-black ${color}`}>{isX ? 'X' : 'O'}</span>
        <div>
          <p className={`font-bold text-sm ${color}`}>{name}</p>
          {config.stealsEnabled && (
            <StealDots count={stealsLeft[currentPlayer]} player={currentPlayer} />
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-cream/40 text-xs font-semibold uppercase tracking-wide hidden sm:block">
          {phase === 'playing' ? 'Your turn' : ''}
        </span>
        {phase === 'playing' && (
          <TimerRing remaining={remaining} total={config.turnSeconds} />
        )}
      </div>
    </div>
  );
}

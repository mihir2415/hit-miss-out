import { useEffect, useState } from 'react';
import type { CellState, Player } from '../types';

interface Props {
  cell: CellState | null;
  row: number;
  col: number;
  currentPlayer: Player;
  stealsEnabled: boolean;
  stealsLeft: number;
  pendingHere: boolean;
  flash: 'hit' | 'miss' | 'steal' | null;
  isWinLine: boolean;
  onClearFlash: () => void;
  onClick: () => void;
}

const PLAYER_STYLES: Record<Player, { bg: string; text: string; border: string; ring: string }> = {
  X: { bg: 'bg-playerX', text: 'text-white', border: 'border-playerX', ring: 'ring-playerX' },
  O: { bg: 'bg-playerO', text: 'text-white', border: 'border-playerO', ring: 'ring-playerO' },
};


export function Cell({
  cell, row, col, currentPlayer, stealsEnabled, stealsLeft,
  pendingHere, flash, isWinLine, onClearFlash, onClick,
}: Props) {
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    if (!flash) return;
    const cls = flash === 'miss' ? 'animate-shake' : 'animate-bounce-in';
    setAnimClass(cls);
    const id = setTimeout(() => {
      setAnimClass('');
      onClearFlash();
    }, 500);
    return () => clearTimeout(id);
  }, [flash, onClearFlash]);

  const canSteal =
    cell !== null &&
    cell.owner !== currentPlayer &&
    stealsEnabled &&
    stealsLeft > 0;

  const isEmpty = cell === null;
  const isOwned = cell !== null;
  const style = isOwned ? PLAYER_STYLES[cell.owner] : null;

  let bgClass = 'bg-pitch-mid hover:bg-pitch-light';
  let borderClass = 'border-pitch-border';
  let flashBg = '';

  if (flash === 'hit' || flash === 'steal') flashBg = 'bg-green-500/20';
  if (flash === 'miss') flashBg = 'bg-red-500/20';

  if (isOwned && style) {
    bgClass = style.bg;
    borderClass = style.border;
  }

  if (pendingHere) borderClass = currentPlayer === 'X' ? 'border-playerX' : 'border-playerO';
  if (isWinLine) borderClass = 'border-gold';

  return (
    <button
      onClick={onClick}
      disabled={isOwned && !canSteal}
      aria-label={`Cell ${row},${col}${cell ? ` claimed by ${cell.owner}: ${cell.answer}` : ' empty'}`}
      className={[
        'relative aspect-square w-full rounded-xl border-2 transition-all duration-150 select-none overflow-hidden',
        bgClass, borderClass,
        isWinLine ? 'animate-glow ring-2 ring-gold' : '',
        pendingHere ? 'ring-2 ' + (currentPlayer === 'X' ? 'ring-playerX' : 'ring-playerO') : '',
        isEmpty ? 'cursor-pointer active:scale-95' : '',
        canSteal ? 'cursor-pointer opacity-100 hover:opacity-80 active:scale-95' : '',
        isOwned && !canSteal ? 'cursor-default' : '',
        animClass,
        flashBg,
      ].filter(Boolean).join(' ')}
    >
      {isEmpty && (
        <span className="absolute inset-0 flex items-center justify-center text-pitch-border/40 text-3xl font-light">
          +
        </span>
      )}

      {isOwned && style && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-1 p-1.5 ${style.text}`}>
          {/* Initials badge */}
          <span className="text-white/30 font-black text-3xl sm:text-4xl leading-none select-none">
            {cell!.owner}
          </span>
          <span className="text-[9px] sm:text-[11px] font-semibold text-center leading-tight break-words px-1 line-clamp-2 opacity-90">
            {cell!.answer}
          </span>
          {cell!.rarityPct !== undefined && cell!.rarityPct > 70 && (
            <span className="text-[8px] text-gold font-bold">
              🔥 Rare {cell!.rarityPct}%
            </span>
          )}
        </div>
      )}

      {cell?.isStolen && (
        <span className="absolute top-1 right-1 text-[8px] font-bold text-white bg-black/40 rounded px-1 leading-tight">
          stolen
        </span>
      )}

      {canSteal && (
        <span className="absolute bottom-1 right-1 text-[9px] text-gold font-bold animate-pulse">
          ⚡steal
        </span>
      )}
    </button>
  );
}

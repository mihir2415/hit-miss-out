import { useEffect, useRef, useState } from 'react';
import type { Category, CricketPlayer, ValidationResult } from '../types';
import { searchPlayers } from '../api';

interface Props {
  rowCategory: Category;
  colCategory: Category;
  isSteal: boolean;
  onSubmit: (name: string) => Promise<ValidationResult | undefined>;
  onCancel: () => void;
}


type Status = 'idle' | 'searching' | 'success' | 'error';

export function PlayerSearch({ rowCategory, colCategory, isSteal, onSubmit, onCancel }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CricketPlayer[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    setSelectedIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      const results = await searchPlayers(query);
      setSuggestions(results);
    }, 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  async function submit(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setStatus('searching');
    setSuggestions([]);
    const result = await onSubmit(trimmed);
    if (!result) return;
    if (result.valid) {
      setStatus('success');
      setMessage(result.message);
    } else {
      setStatus('error');
      setMessage(result.message);
      setTimeout(() => { setStatus('idle'); setMessage(''); setQuery(''); }, 1800);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (selectedIdx >= 0 && suggestions[selectedIdx]) {
        submit(suggestions[selectedIdx].name);
      } else {
        submit(query);
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-md bg-pitch-mid border border-pitch-border rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className={`px-5 pt-5 pb-3 border-b border-pitch-border ${isSteal ? 'bg-gold/10' : ''}`}>
          {isSteal && (
            <div className="flex items-center gap-1.5 text-gold text-xs font-bold mb-1.5 uppercase tracking-wider">
              ⚡ Steal Attempt
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-pitch-light border border-pitch-border rounded-lg px-2.5 py-1 text-xs font-semibold text-cream flex items-center gap-1.5">
              {rowCategory.emoji} {rowCategory.label}
            </span>
            <span className="text-pitch-border text-sm">×</span>
            <span className="bg-pitch-light border border-pitch-border rounded-lg px-2.5 py-1 text-xs font-semibold text-cream flex items-center gap-1.5">
              {colCategory.emoji} {colCategory.label}
            </span>
          </div>
          <p className="text-cream/50 text-xs mt-1.5">
            Name a cricketer who has {rowCategory.description.toLowerCase()} and {colCategory.description.toLowerCase()}
          </p>
        </div>

        {/* Input */}
        <div className="px-5 pt-4 pb-2 relative">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pitch-border text-lg">🔍</span>
            <input
              ref={inputRef}
              className={`w-full bg-pitch-light border rounded-xl pl-10 pr-4 py-3 text-cream placeholder-pitch-border outline-none transition text-sm font-medium
                ${status === 'error' ? 'border-playerX focus:border-playerX' : ''}
                ${status === 'success' ? 'border-green-500 focus:border-green-500' : ''}
                ${status === 'idle' || status === 'searching' ? 'border-pitch-border focus:border-cream/50' : ''}
              `}
              placeholder="Search player…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              disabled={status === 'searching' || status === 'success'}
              autoComplete="off"
            />
            {status === 'searching' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-pitch-border animate-pulse text-sm">
                …
              </span>
            )}
          </div>

          {/* Feedback */}
          {message && (
            <p className={`text-xs mt-2 font-semibold ${status === 'success' ? 'text-green-400' : 'text-playerX'}`}>
              {message}
            </p>
          )}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && status === 'idle' && (
          <ul className="mx-5 mb-2 border border-pitch-border rounded-xl overflow-hidden divide-y divide-pitch-border">
            {suggestions.map((p, i) => (
              <li key={p.id}>
                <button
                  onClick={() => submit(p.name)}
                  onMouseEnter={() => setSelectedIdx(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition
                    ${selectedIdx === i ? 'bg-pitch-light' : 'bg-pitch-mid hover:bg-pitch-light'}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-cream text-sm font-semibold truncate">{p.name}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5 pt-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-pitch-border rounded-xl text-cream/60 text-sm font-semibold hover:border-cream/30 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => submit(selectedIdx >= 0 ? suggestions[selectedIdx]?.name ?? query : query)}
            disabled={!query.trim() || status === 'searching' || status === 'success'}
            className="flex-1 py-3 bg-cream/10 border border-cream/20 hover:bg-cream/20 rounded-xl text-cream text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSteal ? '⚡ Steal' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

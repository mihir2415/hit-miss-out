# Hit Miss Out

Cricket knowledge Tic-Tac-Toe — two players take turns naming a cricketer who satisfies both a row category (national team) and a column category (stat or achievement). First to three in a row wins.

Inspired by [Footy Tic-Tac-Toe](https://playfootball.games/footy-tic-tac-toe/).

---

## Prerequisites

- Node.js 18+
- npm 9+

---

## Setup

```bash
npm install
```

---

## Running locally

```bash
npm run dev
```

Opens at `http://localhost:5173` (Vite picks the next free port if 5173 is taken).

---

## Player data

Player data lives in `src/data/players.ts` and is committed to the repo. You only need to re-run the seeder if you want to refresh or expand the dataset.

### Re-seeding

```bash
npm run seed
```

What it does:

1. Reads the curated stats baseline already in `src/data/players.ts` (runs, wickets, centuries — edit this file manually to update stats).
2. Fetches metadata from the [Wikidata SPARQL endpoint](https://query.wikidata.org/) — IPL team history, playing roles, national captaincy. Results are cached in `.cache/` for 24 hours; delete that directory to force a fresh fetch.
3. Merges by name similarity (threshold 0.6) and adds any Wikidata players who have IPL or World Cup data but aren't in the baseline.
4. Overwrites `src/data/players.ts` with the enriched output.

> **Note:** ESPN Cricinfo's stats API returns 403 for server-side requests. Career stats (test runs, wickets, centuries) must be maintained manually in the baseline — the seeder preserves them.

---

## Project structure

```
hit-miss-out/
├── index.html
├── src/
│   ├── App.tsx
│   ├── types.ts              # shared TypeScript interfaces
│   ├── api/
│   │   └── index.ts          # mocked API layer (swap for real backend later)
│   ├── data/
│   │   ├── players.ts        # 167 cricketers with stats + metadata
│   │   └── puzzles.ts        # pre-defined 3×3 category combos
│   ├── hooks/
│   │   ├── useGame.ts        # game state & logic (useReducer)
│   │   └── useTimer.ts       # 30-second countdown
│   └── components/
│       ├── StartScreen.tsx
│       ├── GameBoard.tsx
│       ├── Cell.tsx
│       ├── PlayerSearch.tsx
│       ├── TurnBanner.tsx
│       └── WinModal.tsx
└── scripts/
    ├── seed.ts               # data seeder entrypoint
    └── lib/
        ├── cache.ts          # 24h filesystem cache
        ├── wikidata.ts       # Wikidata SPARQL queries
        └── worldcup.ts       # hardcoded ODI World Cup winners
```

---

## How to play

1. Enter Player 1 and Player 2 names on the start screen.
2. Choose Daily puzzle (same grid for everyone today) or Random.
3. Toggle steal tokens on or off (3 steals per player — lets you claim an opponent's cell with a different valid answer).
4. Click any empty cell and type a cricketer's name. Autocomplete searches the local dataset.
5. A valid answer fills the cell in your colour. An invalid answer (or letting the 30-second timer expire) counts as a miss and passes the turn.
6. First to three in a row wins.

---

## Tech stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + TypeScript
- [Tailwind CSS v3](https://tailwindcss.com/)
- [tsx](https://github.com/privatenumber/tsx) — runs the seed script without a separate compile step

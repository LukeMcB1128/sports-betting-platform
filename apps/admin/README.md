# apps/admin — Admin Panel

React + TypeScript admin panel for managing games and odds. Intended for internal use only. Runs on a separate port from the bettor-facing web app.

---

## Tech Stack

| | |
|---|---|
| Framework | React 19 + TypeScript (Create React App) |
| Styling | Styled Components |
| State | React hooks + localStorage |
| Sync | Connects to dev-server.js to update (read by the web app in real time(within 3 seconds)) |

---

## Getting Started

```bash
cd apps/admin
npm install
npm start        # → http://localhost:3001
```

> The admin is pinned to **port 3001** via `PORT=3001` in the start script so it does not conflict with the web app on port 3000, and so the "Admin" link in the web navbar always resolves correctly.

---

## Folder Structure

```
src/
  components/
    NavBar.tsx          Top nav — SBP logo + amber "Admin" badge
    GamesTable.tsx      Table listing all games with inline status + action buttons
    AddGameModal.tsx    Modal form to create a new game
    SetLinesModal.tsx   Modal form to set/update moneyline and spread odds
    Modal.tsx           Reusable overlay dialog wrapper
    FormField.tsx       Label + input + error text field wrapper
    Button.tsx          Shared button component (primary / ghost / danger variants)
  pages/
    Dashboard.tsx       Main page — stat cards, games table, modal orchestration
  styles/
    GlobalStyles.ts     Global CSS reset + dark admin color palette (amber accent)
  types/
    index.ts            Shared TypeScript interfaces (Game, GameOdds, form shapes)
  utils/
    gamesStorage.ts     localStorage read/write helpers (persistGames, loadGames)
```

---

## Features

### Add Game
Opens a modal form with:
- Sport dropdown (Basketball, Football, Hockey, Baseball, Soccer)
- League dropdown — auto-populates based on selected sport (NBA, NFL, NHL, etc.)
- Away team / Home team text inputs
- Date and time pickers
- Client-side validation (required fields, teams must differ)
- On submit, game is added with default odds (`-110` across the board) and `upcoming` status

### Set Lines
Opens a modal pre-filled with the game's current odds:
- **Moneyline** — away and home odds (American format, e.g. `-150`, `+130`)
- **Spread** — line and juice for each side (e.g. `-3.5` at `-110`)
- Validates that all fields are non-zero numbers in American odds format
- Disabled for games with `final` status

### Status Management
Inline dropdown per row in the games table:
- `Upcoming` → `Live` → `Final`
- Status changes are persisted to localStorage immediately

### Remove Game
Danger button per row — removes the game from state and localStorage immediately. No confirmation dialog at this stage (auth + confirmation planned for a later milestone).

---

## Admin → Web Sync — How It Works

The admin panel writes the full games array to `localStorage` on every state change. The bettor-facing web app (`apps/web`) reads from the same key and updates its UI in real time using the browser's native `storage` event.

### Flow

```
Admin tab (this app)               Web tab (apps/web)
─────────────────────────────────────────────────────
Any games change (add/edit/remove/status)
        ↓
  persistGames(games)
  localStorage["sbp_games"] = JSON
                                         ↓
                              browser fires `storage` event
                              (fires in all other tabs
                               on the same origin automatically)
                                         ↓
                              web app useGames hook updates state
                                         ↓
                              bettor homepage re-renders
```

### Key files

| File | Role |
|---|---|
| `src/utils/gamesStorage.ts` | Defines `GAMES_STORAGE_KEY = "sbp_games"`. `persistGames(games)` serialises and writes to localStorage. `loadGames()` reads and parses, returns `null` if missing or invalid. |
| `src/pages/Dashboard.tsx` | Initialises state from `loadGames()` (falls back to hardcoded seed data on first run). Calls `persistGames()` inside a `useEffect` whenever the `games` state changes. |

### localStorage key

```
sbp_games  →  JSON array of Game objects
```

This key is shared between both apps. The admin is the sole writer; the web app is the sole reader.

### Seed data

On first load, if `sbp_games` is not present in localStorage, `Dashboard` initialises from a hardcoded `INITIAL_GAMES` array (2 NBA games). These are written to localStorage immediately on mount, so the web app will see them right away.

---

## Color Theme

Dark palette with **amber accent** (`#f59e0b`) to visually distinguish the admin from the bettor-facing blue-accented web app. Defined in `src/styles/GlobalStyles.ts`.

| Token | Hex | Usage |
|---|---|---|
| `bg` | `#0f1117` | Page background |
| `surface` | `#1a1d27` | Cards, nav, table |
| `accent` | `#f59e0b` | Amber — primary buttons, Admin badge |
| `danger` | `#ef4444` | Red — Remove button |
| `success` | `#22c55e` | Green (reserved) |

---

## Planned

- Auth / access control before exposing remove and status actions
- Confirmation dialog on game removal
- Score entry for live games
- Bet resolution trigger on final score submission

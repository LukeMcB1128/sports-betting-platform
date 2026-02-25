# apps/web — Bettor-Facing Frontend

React + TypeScript frontend for bettors. Displays available games with moneyline and spread odds, and reflects changes made in the admin panel in real time.

---

## Tech Stack

| | |
|---|---|
| Framework | React 19 + TypeScript (Create React App) |
| Styling | Styled Components |
| State | React hooks + localStorage |
| Real-time sync | Browser `storage` event (see below) |

---

## Getting Started

```bash
cd apps/web
npm install
npm start        # → http://localhost:3000
```

---

## Folder Structure

```
src/
  components/
    NavBar.tsx        Sticky top nav — logo, links, balance chip, Admin shortcut
    GameCard.tsx      Game matchup card with moneyline + spread odds buttons
    OddsButton.tsx    Clickable odds pill, toggles selected state on click
  hooks/
    useGames.ts       Reads games from localStorage, re-renders on storage events
  pages/
    Home.tsx          Games lobby — groups by Live / League, empty state fallback
  styles/
    GlobalStyles.ts   Global CSS reset + dark sportsbook color palette
  types/
    index.ts          Shared TypeScript interfaces (Game, GameOdds, etc.)
```

---

## Admin Sync — How It Works

Games are authored in the admin panel (`apps/admin`) and shared with this app through the browser's `localStorage`. No backend is required for this to work.

### Flow

```
Admin tab                          Web tab (this app)
─────────────────────────────────────────────────────
User adds/edits/removes a game
        ↓
  localStorage["sbp_games"] = JSON
                                         ↓
                              browser fires `storage` event
                              (native — fires in all other tabs
                               on the same origin)
                                         ↓
                              useGames hook calls setGames()
                                         ↓
                              Home re-renders instantly
```

### Key files

| File | Role |
|---|---|
| `src/hooks/useGames.ts` | Reads `sbp_games` from localStorage on mount. Attaches a `window.addEventListener('storage', ...)` listener that updates state whenever the admin writes a new value. Returns the current games array. |
| `src/pages/Home.tsx` | Calls `useGames(fallback)`. Filters out `final` games (only `upcoming` and `live` are shown). Groups games into sections: **Live Now** first, then by league. |

### localStorage key

```
sbp_games  →  JSON array of Game objects
```

Both apps share the same key name (`sbp_games`). The admin writes it; the web app reads it.

### Why `storage` events?

The browser's `storage` event fires in every tab that shares the same origin **except** the tab that made the write. This means:

- Admin writes → web tab receives the event automatically
- No polling, no websocket, no server needed at this stage
- When a real API is added later, `useGames` can be swapped out to fetch from the API instead, with zero changes needed elsewhere in the app

### Fallback behaviour

If `sbp_games` doesn't exist in localStorage (i.e. the admin has never been opened in this browser), the web app shows an empty state with a prompt to add games from the admin panel.

---

## Routing

Routing is not yet implemented (no `react-router-dom`). The app currently renders the Home page directly. Pages for game detail, login, register, and bet history are planned — see `PLAN.md`.

---

## Color Theme

Dark sportsbook palette defined in `src/styles/GlobalStyles.ts`:

| Token | Hex | Usage |
|---|---|---|
| `bg` | `#0f1117` | Page background |
| `surface` | `#1a1d27` | Cards, nav |
| `accent` | `#3b82f6` | Blue — primary actions, selected odds |
| `live` | `#ef4444` | Red — LIVE badge |
| `positive` | `#22c55e` | Green — positive (underdog) odds |

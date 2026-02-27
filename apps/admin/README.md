# apps/admin — Admin Panel

React + TypeScript admin panel for managing games, odds, scores, and bets. Internal use only. Visually distinct from the bettor app via an amber accent colour.

Runs on **port 3001**. Requires `infra/dev-server.js` to be running on port 3002.

---

## Tech Stack

| | |
|---|---|
| Framework | React 19 + TypeScript (Create React App) |
| Styling | Styled Components |
| State | React hooks |
| Data sync | `fetch` polling to `infra/dev-server.js` every 3–5 seconds |

---

## Getting Started

```bash
# From the repo root, start the dev server first:
node infra/dev-server.js

# Then in a separate terminal:
cd apps/admin
npm install
npm start        # → http://localhost:3001
```

> Port 3001 is pinned via `PORT=3001` in the start script so the "Admin" shortcut link in the bettor web app always resolves correctly.

---

## Folder Structure

```
src/
  api/
    gamesApi.ts         fetchGames, createGame, updateGameStatus, updateGameOdds,
                        togglePublishGame, updateGameScore, updateBettingEnabled, removeGame
    betsApi.ts          fetchBets, deleteBet
  components/
    NavBar.tsx          Top nav — SBP logo + amber "Admin" badge
    GamesTable.tsx      Games table — inline status, action buttons per row
    AddGameModal.tsx    Modal form to create a new game with default odds
    SetLinesModal.tsx   Modal form to update moneyline and spread odds
    EnterScoreModal.tsx Modal form to set or edit away/home scores for live games
    BetsPanel.tsx       Bets table — stats row, all placed bets, per-row Remove button
    Modal.tsx           Reusable overlay dialog wrapper
    FormField.tsx       Label + input + validation error field wrapper
    Button.tsx          Shared button (primary / ghost / danger variants, sm/md sizes)
  pages/
    Dashboard.tsx       Main page — tab bar (Games / Bets), stat cards, modal orchestration
  styles/
    GlobalStyles.ts     Global CSS reset + dark admin color palette (amber accent)
  types/
    index.ts            Shared TypeScript interfaces (Game, Bet, GameOdds, form shapes, etc.)
  utils/
    gamesStorage.ts     Legacy localStorage helpers (unused — retained for reference)
```

---

## Dashboard Tabs

### Games Tab

The default view. Shows four stat cards (Upcoming / Live / Resolving / Final counts) followed by the full `GamesTable`.

### Bets Tab

Shows all bets placed by bettors via the web app. Includes a stats row (Total Bets · Total Staked · Pending · Potential Payout) and a table with a **Remove** button per row.

---

## Features

### Add Game
Opens a modal form with:
- Sport dropdown (Basketball, Football, Hockey, Baseball, Soccer)
- League dropdown — auto-populates based on selected sport (NBA, NFL, NHL, etc.)
- Away team / Home team text inputs
- Date and time pickers
- Client-side validation (required fields, teams must differ)
- On submit: game added with default odds (`-110` across all markets), `upcoming` status, and `bettingEnabled: true`

### Set Lines
Opens a modal pre-filled with the game's current odds:
- **Moneyline** — away and home odds (American format, e.g. `-150`, `+130`)
- **Spread** — line and juice for each side (e.g. `-3.5` at `-110`)
- Validates all fields are non-zero numbers in American odds format
- Disabled for `live`, `resolving`, and `final` games

### Status Management
Inline dropdown per row:

| Status | Meaning |
|---|---|
| `upcoming` | Not yet started — odds buttons visible to bettors |
| `live` | In progress — live betting available if `bettingEnabled` is true |
| `resolving` | Game over, awaiting score entry — betting closed |
| `final` | Score entered — triggers automatic bet settlement |

### Publish / Unpublish
Toggle per row. Only published games are shown to bettors on the web app. Useful for staging a game before making it publicly visible.

### Enable / Disable Betting
Toggle per row, available for any non-final game:
- **Disable Betting** — bettors see a 🔒 Betting suspended banner on the game card; any open bet slip is closed automatically
- **Enable Betting** — restores odds buttons for bettors
- Persisted to the dev server via `PUT /games/:id`

### Enter Score
Available for `live` and `resolving` games. Opens a modal to set or edit the away and home scores. When submitted with `status: "final"`, the dev server automatically settles all pending bets on that game.

### Remove Game
Danger button per row — removes the game from the dev server immediately. Also removes it from the bettor web app within 3 seconds via polling.

### Remove Bet (Bets tab)
Per-row **Remove** button in the Bets tab. Calls `DELETE /bets/:id`. The bet disappears from the table immediately (optimistic removal) and from the bettor's My Bets page within 3 seconds.

---

## Auto-Settlement

When a game is updated to `final` with scores, `infra/dev-server.js` settles all pending bets automatically:

- **Moneyline** — compares scores; tied game → `void`
- **Spread** — applies the line stored on the bet at placement time (immune to post-bet odds edits); exact cover → `void` (push)
- Won bets: full payout credited to bettor balance
- Void bets: stake refunded to bettor balance
- Lost bets: no credit (stake already deducted at placement)

The bettor's My Bets page and NavBar balance reflect the result within 3 seconds.

---

## Color Theme

Dark palette with **amber accent** to visually distinguish the admin from the blue-accented bettor web app. Defined in `src/styles/GlobalStyles.ts`.

| Token | Hex | Usage |
|---|---|---|
| `bg` | `#0f1117` | Page background |
| `surface` | `#1a1d27` | Cards, nav, table |
| `surfaceHover` | `#22263a` | Hover states, input backgrounds |
| `border` | `#2a2d3e` | Dividers, table borders |
| `accent` | `#f59e0b` | Amber — primary buttons, Admin badge, active tab |
| `danger` | `#ef4444` | Red — Remove buttons |
| `success` | `#22c55e` | Green — won bet status |
| `textMuted` | `#7b8199` | Secondary labels |

---

## Planned

- Authentication and access control before exposing destructive actions
- Confirmation dialog on game and bet removal
- Audit log of admin actions (score edits, status changes)

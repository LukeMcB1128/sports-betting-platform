# apps/web — Bettor-Facing Frontend

React + TypeScript frontend for bettors. Browse available games, place moneyline and spread bets, track bet history, and see live settlement results.

Runs on **port 3000**. Requires `infra/dev-server.js` to be running on port 3002.

---

## Tech Stack

| | |
|---|---|
| Framework | React 19 + TypeScript (Create React App) |
| Styling | Styled Components |
| State | React hooks |
| Data sync | `fetch` polling to `infra/dev-server.js` every 3 seconds |

---

## Getting Started

```bash
# From the repo root, start the dev server first:
node infra/dev-server.js

# Then in a separate terminal:
cd apps/web
npm install
npm start        # → http://localhost:3000
```

---

## Folder Structure

```
src/
  api/
    betsApi.ts        placeBet(), getBalance(), getBets() — fetch wrappers
  components/
    NavBar.tsx        Sticky top nav — logo, page links, live balance chip, Admin shortcut
    GameCard.tsx      Game card with team names, scores, odds buttons, and inline bet slip
    OddsButton.tsx    Controlled odds pill — highlights when selected, accepts selected + onSelect props
    BetSlipPanel.tsx  Inline bet slip — stake input, live payout calc, Place Bet button
  hooks/
    useGames.ts       Polls GET /games every 3s; returns current games array
    useBets.ts        Polls GET /bets every 3s; returns current bets array
  pages/
    Home.tsx          Games lobby — Live Now section + grouped by league; passes balance + handler to GameCard
    MyBets.tsx        Bet history — status-aware cards, stats row (staked / pending / net P&L)
  styles/
    GlobalStyles.ts   Global CSS reset + dark sportsbook color palette
  types/
    index.ts          Shared TypeScript interfaces (Game, Bet, GameOdds, BetSide, BetStatus, etc.)
  App.tsx             Root — path-based routing, balance polling, wires NavBar + pages
```

---

## Pages

### `/` — Games Lobby

- Lists all published, non-final games fetched from the dev server
- **Live Now** section shown at the top when live games are present
- Games grouped by league below
- Each game shows a `GameCard` with:
  - Matchup header (league · time/status, LIVE or RESOLVING badge)
  - Team names and scores (when live, resolving, or final)
  - Moneyline and spread odds buttons (when `bettingEnabled` is true)
  - 🔒 **Betting suspended** banner when `bettingEnabled` is false
  - Inline `BetSlipPanel` when an odds button is selected

### `/bets` — My Bets

- Full bet history polled from the dev server
- Stats row: Total Bets · Total Staked · Pending · Net P&L (green/red)
- Each bet card shows:
  - Status badge + market tag + selection label + odds
  - Final score inline when the game has been resolved (e.g. `Lakers 108 @ Celtics 112 · NBA · Final`)
  - Status-aware amount row:
    - `pending` → Stake | To Win | Payout
    - `won` → Stake | Profit (green) | Payout (green)
    - `lost` → Stake Lost (red) | To Win
    - `void` → Stake Refunded (muted)
  - Coloured left border (green = won, red = lost, grey = void, none = pending)
- Settled bets (won → lost → void) sorted to the top; pending below

---

## Routing

Path-based routing via `window.location.pathname` — no routing library.

| Path | Page |
|---|---|
| `/` | Home (Games lobby) |
| `/bets` | My Bets |

`App.tsx` reads `window.location.pathname` on render and mounts the appropriate page. `NavBar` highlights the active link using the same check.

---

## Bet Flow

1. Bettor clicks an odds button on a `GameCard` → `BetSlipPanel` opens inline
2. Bettor enters a stake amount → payout updates live using American odds formula:
   - `odds > 0` → profit = stake × (odds / 100)
   - `odds < 0` → profit = stake × (100 / |odds|)
3. Bettor clicks **Place Bet** → `POST /bets` to the dev server
4. Stake deducted from balance; `BetSlipPanel` closes; NavBar balance updates
5. Bet appears on My Bets page with `pending` status
6. When the admin marks the game final with scores, the dev server settles all pending bets automatically; My Bets page reflects the result within 3 seconds

---

## Live Balance

`App.tsx` polls `GET /balance` every 3 seconds. The NavBar balance chip updates automatically when:
- A bet is placed (stake deducted)
- A won bet is settled (payout credited)
- A void/push bet is settled (stake refunded)

---

## Live Betting

When a game is set to `live` status by the admin, betting remains open if `bettingEnabled` is `true`. The admin can toggle betting on or off per game at any time. When suspended, the odds buttons are replaced by a 🔒 **Betting suspended** banner and any open bet slip is closed automatically.

---

## Color Theme

Dark sportsbook palette defined in `src/styles/GlobalStyles.ts`:

| Token | Hex | Usage |
|---|---|---|
| `bg` | `#0f1117` | Page background |
| `surface` | `#1a1d27` | Cards, nav |
| `surfaceHover` | `#22263a` | Hover states, input backgrounds |
| `border` | `#2a2d3e` | Dividers, card borders |
| `accent` | `#3b82f6` | Blue — primary actions, selected odds |
| `live` | `#ef4444` | Red — LIVE badge |
| `positive` | `#22c55e` | Green — positive odds, won bets |
| `negative` | `#ef4444` | Red — negative result, lost bets |
| `textMuted` | `#7b8199` | Secondary labels |

# Web Frontend Plan — `apps/web`

React + TypeScript bettor-facing UI.

---

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Games Lobby | Live + upcoming games with odds cards |
| `/game/:id` | Game Detail | Full odds breakdown, bet slip entry |
| `/login` | Login | Email + password auth |
| `/register` | Register | New account creation |
| `/bets` | My Bets | Bet history, settled/pending status |
| `/account` | Account | Balance, profile |

---

## Key Components

### Layout
- `NavBar` — logo, balance display, nav links, auth state (login/logout)
- `BetSlip` — fixed sidebar/drawer showing selected bets; handles stake entry and submission

### Games Lobby
- `GameCard` — team names, start time, LIVE badge, moneyline + spread odds buttons
- `OddsButton` — clickable pill showing odds (e.g. `-110`); highlights when selected in bet slip
- `LiveBadge` — "LIVE" red badge for in-progress games
- `GameList` — groups cards by sport/league, filters for live vs upcoming

### Game Detail
- `TeamMatchup` — large team names with logos, score if live
- `MarketTable` — moneyline and spread rows with `OddsButton`s for both sides
- `GameInfo` — tip-off time, location, league

### Bets
- `BetCard` — individual bet entry: teams, type (ML/spread), stake, potential payout, status badge (Pending / Won / Lost / Push)
- `BetStatusBadge` — color-coded status chip

---

## State Management

| Concern | Approach |
|---|---|
| Auth (user, token, balance) | React Context + localStorage |
| Bet slip (selected picks, stakes) | React Context |
| Games data | React Query (fetch + cache) |
| Real-time updates | SignalR client, invalidates React Query cache on events |

---

## SignalR Events (from API hub)

| Event | Action |
|---|---|
| `OddsUpdated` | Refresh odds on affected game card / detail |
| `GameStatusChanged` | Toggle LIVE badge, update score |
| `BetSettled` | Update bet card status in My Bets; update balance |

---

## API Integration

Base URL from `VITE_API_URL` env var.

| Endpoint | Usage |
|---|---|
| `POST /auth/login` | Login |
| `POST /auth/register` | Register |
| `GET /games` | Fetch all active games + odds |
| `GET /games/:id` | Single game detail |
| `POST /bets` | Place a bet |
| `GET /bets` | My bets history |
| `GET /account/balance` | Current balance |

---

## Folder Structure

```
apps/web/
  src/
    api/           Axios client + endpoint functions
    components/    Shared UI components
    contexts/      AuthContext, BetSlipContext
    hooks/         useSignalR, useGames, useBets
    pages/         One file per route
    types/         TypeScript interfaces (Game, Bet, User, Odds)
  public/
  index.html
  vite.config.ts
  tsconfig.json
```

---

## Styling

Tailwind CSS — dark sports-book theme (dark bg, accent green for positive odds, accent red for negative).

---

## Notes

- Moneyline: pick a team to win outright. American odds format (e.g. `-150`, `+130`).
- Spread: team must win/lose by a margin. Listed as `+3.5` / `-3.5` with a juice (e.g. `-110`).
- Bet slip enforces max 1 selection per game (no parlays in v1).
- Payout = stake * (odds conversion to decimal).

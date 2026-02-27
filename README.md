# Sports Betting Platform

A regional sports betting platform supporting moneylines and spreads with real-time game management and automatic bet resolution.

---

## Tech Stack

### Current (dev)

| Layer | Technology |
|---|---|
| Bettor frontend | React 19 + TypeScript — `apps/web` (port 3000) |
| Admin panel | React 19 + TypeScript — `apps/admin` (port 3001) |
| Dev API server | Node.js (no dependencies) — `infra/dev-server.js` (port 3002) |
| Styling | Styled Components |

### Planned (production)

| Layer | Technology |
|---|---|
| Backend API | C# ASP.NET Core |
| Real-time | SignalR |
| Database | PostgreSQL |
| Containerisation | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## Repo Structure

```
sports-betting-platform/
  apps/
    web/          Bettor-facing React frontend
    admin/        Internal React admin panel
  infra/
    dev-server.js   In-memory Node.js API (games, bets, balance)
  README.md
```

---

## Getting Started

### Prerequisites

- Node.js v18+

### Running Locally

1. Clone the repo

```bash
git clone https://github.com/LukeMcB1128/sports-betting-platform.git
cd sports-betting-platform
```

2. Start the dev API server first (required by both apps)

```bash
node infra/dev-server.js
# → http://localhost:3002
```

3. Start the bettor web app

```bash
cd apps/web
npm install
npm start
# → http://localhost:3000
```

4. Start the admin panel

```bash
cd apps/admin
npm install
npm start
# → http://localhost:3001
```

> All three processes need to be running at the same time. The dev server is the shared data layer — restarting it resets all in-memory state (games, bets, balance).

---

## Dev API Server

`infra/dev-server.js` is a zero-dependency Node.js HTTP server that acts as the shared backend during development. It holds all state in memory.

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/games` | Return all games |
| `POST` | `/games` | Add a new game |
| `PUT` | `/games/:id` | Partial update a game (status, odds, scores, bettingEnabled) |
| `DELETE` | `/games/:id` | Remove a game |
| `GET` | `/balance` | Return the current bettor balance |
| `GET` | `/bets` | Return all placed bets |
| `POST` | `/bets` | Place a new bet (deducts stake from balance) |
| `DELETE` | `/bets/:id` | Remove a bet record |

### Auto-settlement

When a game is updated to `status: "final"` with `homeScore` and `awayScore` present, the server automatically settles all pending bets on that game:

- **Moneyline** — winner determined by score comparison; tied scores → `void`
- **Spread** — applies the handicap line stored on the bet at placement time; exact cover → `void` (push)
- Won bets credit the full payout to balance; void bets refund the stake

### Resetting

Restart the process to wipe all data back to defaults ($1,000 balance, no games, no bets):

```bash
lsof -i :3002 -t | xargs kill && node infra/dev-server.js &
```

---

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code |
| `testing` | Integration and testing |
| `feature-*` | Individual features |

PRs go `feature-* → testing`. When stable, `testing → main`.

---

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code |
| `testing` | Integration and testing |
| `feature-*` | Individual features |

PRs go `feature-* → testing`. When stable, `testing → main`.

---

## Contributing

1. Branch off `testing`
2. Name your branch `feature/your-feature-name`
3. Open a PR targeting `testing`
4. Get a review before merging

---

## License

Private. All rights reserved.

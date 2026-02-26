# Sports Betting Platform

A regional sports betting platform supporting moneylines and spreads with real time game resolution.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Admin Panel | React + TypeScript |
| Backend API | C# ASP.NET Core |
| Real Time | SignalR |
| Database | PostgreSQL |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## Repo Structure

```
sports-betting-platform/
  apps/
    web/          React frontend for bettors
    api/          C# ASP.NET Core backend
    admin/        React admin panel for manual stat entry
  infra/
    docker-compose.yml
    nginx.conf
  .github/
    workflows/
      api.yml
      web.yml
      admin.yml
  README.md
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- .NET 8 SDK
- Docker + Docker Compose
- PostgreSQL (or just use Docker)

### Running Locally

1. Clone the repo

```bash
git clone https://github.com/LukeMcB1128/sports-betting-platform.git
cd sports-betting-platform
```

2. Start all services via Docker

```bash
docker-compose up --build
```

3. Or run individually:

**API**
```bash
cd apps/api
dotnet run
```

**Server**
```bash
node infra/dev-server.js
```

**Web**
```bash
cd apps/web
npm install
npm run dev
```

**Admin**
```bash
cd apps/admin
npm install
npm run dev
```

---

## Environment Variables

Each app has its own `.env` file. Copy the example files to get started:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
```

> Never commit `.env` files. They are gitignored by default.

---

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production ready code |
| `Testing` | Integration/testing branch |
| `feature-` | Individual features |

PRs go `feature- -> testing`. When stable, `testing -> main`.

---

## Bet Types Supported

- Moneyline
- Spread

Game results and winners are manually entered via the admin panel at the end of each game which triggers automatic bet resolution.

---

## Contributing

1. Branch off `testing`
2. Name your branch `feature/your-feature-name`
3. Open a PR targeting `testing`
4. Get a review before merging

---

## License

Private. All rights reserved.

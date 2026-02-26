/**
 * SBP Dev API Server
 *
 * Lightweight in-memory JSON server used during local development.
 * Acts as a shared data store between the admin (port 3001) and web (port 3000) apps,
 * bypassing the localStorage origin restriction (localhost:3000 vs localhost:3001
 * are different origins and cannot share localStorage).
 *
 * Run:  node infra/dev-server.js
 * Port: 3002
 *
 * Routes:
 *   GET    /games          → return all games
 *   POST   /games          → add a game
 *   PUT    /games/:id      → update a game (partial merge)
 *   DELETE /games/:id      → remove a game
 *   GET    /bets           → return all bets
 *   POST   /bets           → place a bet (deducts from balance)
 *   GET    /balance        → return current balance
 *
 * Replace with the real ASP.NET Core API when that is ready.
 */

const http = require('http');

let games = [];
let bets = [];
let balance = 1000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });

const calcPayout = (stake, odds) => {
  const profit = odds > 0
    ? stake * (odds / 100)
    : stake * (100 / Math.abs(odds));
  return parseFloat((stake + profit).toFixed(2));
};

const server = http.createServer(async (req, res) => {
  // Apply CORS headers to every response
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  // Parse URL — strip query string, split into parts
  const pathname = req.url.split('?')[0];
  const parts = pathname.split('/').filter(Boolean);
  const resource = parts[0];
  const id = parts[1] ?? null;

  try {
    // ── /balance ──────────────────────────────────────────────────────────────

    // GET /balance
    if (req.method === 'GET' && resource === 'balance') {
      res.writeHead(200);
      res.end(JSON.stringify({ balance }));
      return;
    }

    // ── /bets ─────────────────────────────────────────────────────────────────

    // GET /bets
    if (req.method === 'GET' && resource === 'bets') {
      res.writeHead(200);
      res.end(JSON.stringify(bets));
      return;
    }

    // POST /bets  — place a bet
    if (req.method === 'POST' && resource === 'bets') {
      const { gameId, betType, side, label, odds, stake } = await readBody(req);

      if (!gameId || !betType || !side || !label || odds == null || !stake) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing required fields' }));
        return;
      }
      if (typeof stake !== 'number' || stake <= 0) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Stake must be a positive number' }));
        return;
      }
      if (stake > balance) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Insufficient balance' }));
        return;
      }

      const payout = calcPayout(stake, odds);
      const bet = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        gameId,
        betType,
        side,
        label,
        odds,
        stake,
        payout,
        status: 'pending',
        placedAt: new Date().toISOString(),
      };

      bets.unshift(bet);
      balance = parseFloat((balance - stake).toFixed(2));
      console.log(`[BET]    ${label} @ ${odds > 0 ? '+' : ''}${odds}  stake=$${stake}  balance=$${balance}`);
      res.writeHead(201);
      res.end(JSON.stringify({ bet, balance }));
      return;
    }

    // ── /games ────────────────────────────────────────────────────────────────

    // GET /games
    if (req.method === 'GET' && resource === 'games' && !id) {
      res.writeHead(200);
      res.end(JSON.stringify(games));
      return;
    }

    // POST /games
    if (req.method === 'POST' && resource === 'games') {
      const game = await readBody(req);
      games.unshift(game);
      console.log(`[ADD]    ${game.awayTeam} @ ${game.homeTeam} (${game.league})`);
      res.writeHead(201);
      res.end(JSON.stringify(game));
      return;
    }

    // PUT /games/:id
    if (req.method === 'PUT' && resource === 'games' && id) {
      const updates = await readBody(req);
      games = games.map((g) => (g.id === id ? { ...g, ...updates } : g));
      const updated = games.find((g) => g.id === id);
      if (!updated) { res.writeHead(404); res.end(JSON.stringify({ error: 'Game not found' })); return; }
      console.log(`[UPDATE] id=${id}`, Object.keys(updates).join(', '));
      res.writeHead(200);
      res.end(JSON.stringify(updated));
      return;
    }

    // DELETE /games/:id
    if (req.method === 'DELETE' && resource === 'games' && id) {
      const before = games.length;
      games = games.filter((g) => g.id !== id);
      if (games.length === before) { res.writeHead(404); res.end(JSON.stringify({ error: 'Game not found' })); return; }
      console.log(`[REMOVE] id=${id}`);
      res.writeHead(204);
      res.end();
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(3002, () => {
  console.log('');
  console.log('  SBP Dev API  →  http://localhost:3002');
  console.log('');
});

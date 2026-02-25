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
 *
 * Replace with the real ASP.NET Core API when that is ready.
 */

const http = require('http');

let games = [];

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

  // Extract id from /games/:id
  const parts = req.url.split('/').filter(Boolean);
  const id = parts[1] ?? null; // parts[0] === 'games'

  try {
    // GET /games
    if (req.method === 'GET' && req.url === '/games') {
      res.writeHead(200);
      res.end(JSON.stringify(games));
      return;
    }

    // POST /games
    if (req.method === 'POST' && req.url === '/games') {
      const game = await readBody(req);
      games.unshift(game);
      console.log(`[ADD]    ${game.awayTeam} @ ${game.homeTeam} (${game.league})`);
      res.writeHead(201);
      res.end(JSON.stringify(game));
      return;
    }

    // PUT /games/:id
    if (req.method === 'PUT' && id) {
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
    if (req.method === 'DELETE' && id) {
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

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
 *   GET    /games                → return all games
 *   POST   /games                → add a game
 *   PUT    /games/:id            → update a game (partial merge); auto-settles pending
 *                                  bets when game transitions to final with scores
 *   DELETE /games/:id            → remove a game
 *   GET    /bets                 → return all bets
 *   POST   /bets                 → place a bet (deducts from balance)
 *   DELETE /bets/:id             → remove a bet record
 *   GET    /balance              → return current balance
 *
 *   POST   /auth/signup          → register a new user (status: pending)
 *   POST   /auth/signin          → authenticate user + log attempt
 *
 *   POST   /admin/login          → admin authentication → returns session token
 *   POST   /admin/logout         → invalidate session token
 *   GET    /admin/users          → list all users, passwords excluded (admin only)
 *   PUT    /admin/users/:id      → update user status: verified|denied|pending (admin only)
 *   GET    /admin/signin-log     → get sign-in attempt log (admin only)
 *
 * Replace with the real ASP.NET Core API when that is ready.
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ── In-memory game/bet state ────────────────────────────────────────────────────
let games = [];
let bets = [];
let balance = 1000;

// Active admin session tokens — cleared on server restart
const adminTokens = new Set();

// ── File paths for persistent auth data ────────────────────────────────────────
// These files are .gitignored; the server creates them automatically on first run.
const USERS_FILE = path.join(__dirname, 'users.json');
const LOG_FILE   = path.join(__dirname, 'signin-log.json');

// ── Admin credentials ───────────────────────────────────────────────────────────
// Change these before deploying. Never committed to source control.
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin123!';

// ── File helpers ────────────────────────────────────────────────────────────────

const readData = (file, defaultVal) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return defaultVal;
  }
};

const writeData = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// ── Crypto helpers ──────────────────────────────────────────────────────────────

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const generateToken = () => crypto.randomBytes(32).toString('hex');

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, stored) => {
  const [salt, hash] = stored.split(':');
  const verify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verify;
};

const validateAdminToken = (req) => {
  const token = req.headers['x-admin-token'];
  return token && adminTokens.has(token);
};

// ── CORS ────────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
};

// ── Body parser ─────────────────────────────────────────────────────────────────

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

// ── Bet helpers ─────────────────────────────────────────────────────────────────

const calcPayout = (stake, odds) => {
  const profit = odds > 0
    ? stake * (odds / 100)
    : stake * (100 / Math.abs(odds));
  return parseFloat((stake + profit).toFixed(2));
};

/**
 * Determine the outcome of a single pending bet given a final game result.
 * Returns 'won', 'lost', or 'void' (push / tie).
 */
const settleBetOutcome = (bet, game) => {
  const { awayScore, homeScore } = game;

  if (bet.betType === 'moneyline') {
    if (awayScore === homeScore) return 'void';
    return bet.side === 'away'
      ? (awayScore > homeScore ? 'won' : 'lost')
      : (homeScore > awayScore ? 'won' : 'lost');
  }

  if (bet.betType === 'spread') {
    // Use the line stored at bet-placement time (bet.line); fall back to the
    // game's current spread if the bet pre-dates the line field.
    let line = bet.line;
    if (line == null) {
      line = bet.side === 'away'
        ? game.odds.spread.away.line
        : game.odds.spread.home.line;
    }
    const margin = bet.side === 'away'
      ? (awayScore + line) - homeScore
      : (homeScore + line) - awayScore;

    if (margin === 0) return 'void';
    return margin > 0 ? 'won' : 'lost';
  }

  return 'void';
};

/**
 * Settle all pending bets for a game that has just reached final status.
 * Credits won payouts (and void stakes) back to the balance.
 */
const settleGameBets = (game) => {
  let settled = 0;
  bets = bets.map((bet) => {
    if (bet.gameId !== game.id || bet.status !== 'pending') return bet;
    const newStatus = settleBetOutcome(bet, game);
    if (newStatus === 'won')  balance = parseFloat((balance + bet.payout).toFixed(2));
    if (newStatus === 'void') balance = parseFloat((balance + bet.stake).toFixed(2));
    settled++;
    console.log(`[SETTLE] ${bet.label} → ${newStatus.toUpperCase()}  balance=$${balance}`);
    return { ...bet, status: newStatus };
  });
  if (settled > 0) {
    console.log(`[SETTLE] ${settled} bet(s) settled for game ${game.id}`);
  }
};

// ── Server ──────────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  // Parse URL — strip query string, split into parts
  const pathname = req.url.split('?')[0];
  const parts    = pathname.split('/').filter(Boolean);
  const resource = parts[0];        // 'auth' | 'admin' | 'games' | 'bets' | 'balance'
  const id       = parts[1] ?? null; // sub-path or UUID
  const subId    = parts[2] ?? null; // e.g. user UUID for /admin/users/:id

  try {

    // ── /balance ──────────────────────────────────────────────────────────────

    if (req.method === 'GET' && resource === 'balance') {
      res.writeHead(200);
      res.end(JSON.stringify({ balance }));
      return;
    }

    // ── /auth ─────────────────────────────────────────────────────────────────

    // POST /auth/signup
    if (req.method === 'POST' && resource === 'auth' && id === 'signup') {
      const { firstName, lastName, password } = await readBody(req);

      if (!firstName || !lastName || !password) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'First name, last name, and password are required' }));
        return;
      }

      const data = readData(USERS_FILE, { users: [] });
      const exists = data.users.find(
        (u) =>
          u.firstName.toLowerCase() === firstName.toLowerCase() &&
          u.lastName.toLowerCase() === lastName.toLowerCase()
      );

      if (exists) {
        res.writeHead(409);
        res.end(JSON.stringify({ error: 'An account with this name already exists' }));
        return;
      }

      const user = {
        id: generateId(),
        firstName,
        lastName,
        passwordHash: hashPassword(password),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      data.users.push(user);
      writeData(USERS_FILE, data);
      console.log(`[SIGNUP] ${firstName} ${lastName} → pending`);
      res.writeHead(201);
      res.end(JSON.stringify({ success: true, status: 'pending' }));
      return;
    }

    // POST /auth/signin
    if (req.method === 'POST' && resource === 'auth' && id === 'signin') {
      const { firstName, lastName, password } = await readBody(req);

      if (!firstName || !lastName || !password) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing required fields' }));
        return;
      }

      const data    = readData(USERS_FILE, { users: [] });
      const logData = readData(LOG_FILE, { logs: [] });

      const user = data.users.find(
        (u) =>
          u.firstName.toLowerCase() === firstName.toLowerCase() &&
          u.lastName.toLowerCase() === lastName.toLowerCase()
      );

      const logEntry = {
        id: generateId(),
        name: `${firstName} ${lastName}`,
        timestamp: new Date().toISOString(),
        success: false,
        reason: '',
      };

      // Invalid credentials
      if (!user || !verifyPassword(password, user.passwordHash)) {
        logEntry.reason = 'Invalid credentials';
        logData.logs.unshift(logEntry);
        writeData(LOG_FILE, logData);
        console.log(`[SIGNIN] ${firstName} ${lastName} → invalid credentials`);
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Invalid name or password' }));
        return;
      }

      // Valid credentials — check verification status
      logEntry.userId = user.id;
      logEntry.name   = `${user.firstName} ${user.lastName}`;

      if (user.status === 'verified') {
        logEntry.success = true;
        logEntry.reason  = 'Verified';
        logData.logs.unshift(logEntry);
        writeData(LOG_FILE, logData);
        console.log(`[SIGNIN] ${user.firstName} ${user.lastName} → allowed`);
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          user: { id: user.id, firstName: user.firstName, lastName: user.lastName },
        }));
      } else {
        logEntry.success = false;
        logEntry.reason  = user.status === 'denied' ? 'Account denied' : 'Pending verification';
        logData.logs.unshift(logEntry);
        writeData(LOG_FILE, logData);
        console.log(`[SIGNIN] ${user.firstName} ${user.lastName} → blocked (${user.status})`);
        res.writeHead(403);
        res.end(JSON.stringify({
          error: user.status === 'denied'
            ? 'Your account has been denied. Please contact support.'
            : 'Your account is pending verification. Please wait for admin approval.',
          status: user.status,
        }));
      }
      return;
    }

    // ── /admin ────────────────────────────────────────────────────────────────

    // POST /admin/login
    if (req.method === 'POST' && resource === 'admin' && id === 'login') {
      const { username, password } = await readBody(req);
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = generateToken();
        adminTokens.add(token);
        console.log('[ADMIN] Login successful');
        res.writeHead(200);
        res.end(JSON.stringify({ token }));
      } else {
        console.log('[ADMIN] Failed login attempt');
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Invalid admin credentials' }));
      }
      return;
    }

    // POST /admin/logout
    if (req.method === 'POST' && resource === 'admin' && id === 'logout') {
      const token = req.headers['x-admin-token'];
      if (token) adminTokens.delete(token);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // GET /admin/users
    if (req.method === 'GET' && resource === 'admin' && id === 'users' && !subId) {
      if (!validateAdminToken(req)) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      const data      = readData(USERS_FILE, { users: [] });
      const safeUsers = data.users.map(({ passwordHash, ...u }) => u);
      res.writeHead(200);
      res.end(JSON.stringify(safeUsers));
      return;
    }

    // PUT /admin/users/:userId
    if (req.method === 'PUT' && resource === 'admin' && id === 'users' && subId) {
      if (!validateAdminToken(req)) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      const { status } = await readBody(req);
      if (!['verified', 'denied', 'pending'].includes(status)) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid status. Must be: verified, denied, or pending' }));
        return;
      }
      const data = readData(USERS_FILE, { users: [] });
      const idx  = data.users.findIndex((u) => u.id === subId);
      if (idx === -1) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'User not found' }));
        return;
      }
      data.users[idx].status = status;
      writeData(USERS_FILE, data);
      const { passwordHash, ...safeUser } = data.users[idx];
      console.log(`[ADMIN] ${safeUser.firstName} ${safeUser.lastName} → ${status}`);
      res.writeHead(200);
      res.end(JSON.stringify(safeUser));
      return;
    }

    // GET /admin/signin-log
    if (req.method === 'GET' && resource === 'admin' && id === 'signin-log') {
      if (!validateAdminToken(req)) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      const data = readData(LOG_FILE, { logs: [] });
      res.writeHead(200);
      res.end(JSON.stringify(data.logs));
      return;
    }

    // ── /bets ─────────────────────────────────────────────────────────────────

    // GET /bets
    if (req.method === 'GET' && resource === 'bets' && !id) {
      res.writeHead(200);
      res.end(JSON.stringify(bets));
      return;
    }

    // POST /bets — place a bet
    if (req.method === 'POST' && resource === 'bets') {
      const { gameId, betType, side, label, odds, stake, line } = await readBody(req);

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
        id: generateId(),
        gameId,
        betType,
        side,
        label,
        odds,
        ...(line != null ? { line } : {}),
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

    // DELETE /bets/:id — remove a bet record
    if (req.method === 'DELETE' && resource === 'bets' && id) {
      const before = bets.length;
      bets = bets.filter((b) => b.id !== id);
      if (bets.length === before) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Bet not found' }));
        return;
      }
      console.log(`[BET_DEL] id=${id}`);
      res.writeHead(204);
      res.end();
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
      if (!updated) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Game not found' }));
        return;
      }
      console.log(`[UPDATE] id=${id}`, Object.keys(updates).join(', '));

      if (
        updated.status === 'final' &&
        updated.homeScore !== undefined &&
        updated.awayScore !== undefined
      ) {
        settleGameBets(updated);
      }

      res.writeHead(200);
      res.end(JSON.stringify(updated));
      return;
    }

    // DELETE /games/:id
    if (req.method === 'DELETE' && resource === 'games' && id) {
      const before = games.length;
      games = games.filter((g) => g.id !== id);
      if (games.length === before) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Game not found' }));
        return;
      }
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
  console.log('  Admin creds  →  username: admin  |  password: Admin123!');
  console.log('  User data    →  infra/users.json  (created on first sign-up)');
  console.log('  Sign-in log  →  infra/signin-log.json');
  console.log('');
});

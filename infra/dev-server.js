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
 *   POST   /admin/verify-password  → verify admin password for destructive actions
 *   GET    /admin/users          → list all users, passwords excluded (admin only)
 *   PUT    /admin/users/:id      → update user status: verified|denied|pending (admin only)
 *   GET    /admin/signin-log     → get sign-in attempt log (admin only)
 *   POST   /games/:id/void-bets    → void all pending bets for a game (admin only)
 *
 * Replace with the real ASP.NET Core API when that is ready.
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ── In-memory game/bet/parlay state ──────────────────────────────────────────
let games   = [];
let bets    = [];
let parlays = [];
let balance = 1000;

// Active admin session tokens — map of token → createdAt timestamp
// Persisted to disk so tokens survive server restarts/redeploys.
const adminTokens = new Map();

// Token TTL: 24 hours
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// ── Rate limiting ────────────────────────────────────────────────────────────────
// Simple in-memory per-IP counter. Resets after the window expires.
const rateLimitMap = new Map(); // ip → { count, windowStart }
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

const isRateLimited = (ip) => {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
};

const resetRateLimit = (ip) => rateLimitMap.delete(ip);

// ── File paths for persistent auth data ────────────────────────────────────────
// DATA_DIR lets Render mount a persistent disk at a separate path without
// overwriting the source files in infra/. Defaults to __dirname for local dev.
const DATA_DIR      = process.env.DATA_DIR || __dirname;
const USERS_FILE     = path.join(DATA_DIR, 'users.json');
const LOG_FILE       = path.join(DATA_DIR, 'signin-log.json');
const GAMES_FILE     = path.join(DATA_DIR, 'games.json');
const BETS_FILE      = path.join(DATA_DIR, 'bets.json');
const PARLAYS_FILE   = path.join(DATA_DIR, 'parlays.json');
const TOKENS_FILE    = path.join(DATA_DIR, 'admin-tokens.json');
const SETTINGS_FILE  = path.join(DATA_DIR, 'settings.json');

// ── Admin credentials ───────────────────────────────────────────────────────────
// Set ADMIN_USERNAME and ADMIN_PASSWORD environment variables in production.
// Defaults are for local dev only — never deploy with these.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

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

// Load persisted games, bets, parlays, and settings on startup
games    = readData(GAMES_FILE,    []);
bets     = readData(BETS_FILE,     []);
parlays  = readData(PARLAYS_FILE,  []);
let settings = readData(SETTINGS_FILE, { parlayMaxPayout: 250, parlayMaxStake: null });

const saveGames    = () => writeData(GAMES_FILE,    games);
const saveBets     = () => writeData(BETS_FILE,     bets);
const saveParlays  = () => writeData(PARLAYS_FILE,  parlays);
const saveSettings = () => writeData(SETTINGS_FILE, settings);
const saveTokens   = () => writeData(TOKENS_FILE,   Object.fromEntries(adminTokens));

// Load persisted admin tokens, pruning any that are already expired
const storedTokens = readData(TOKENS_FILE, {});
const now = Date.now();
Object.entries(storedTokens).forEach(([token, createdAt]) => {
  if (now - createdAt < TOKEN_TTL_MS) adminTokens.set(token, createdAt);
});

// ── Crypto helpers ──────────────────────────────────────────────────────────────

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const generateToken = () => crypto.randomBytes(32).toString('hex');

// ── Startup migration: fix integer/duplicate game IDs ───────────────────────
{
  const seen = new Set();
  // oldId -> newId for the FIRST game seen with that id; duplicates get their
  // own new IDs but bets/parlays (which can't be disambiguated) all follow the
  // first game's new ID.
  const idMap = new Map();

  games = games.map((g) => {
    const isIntegerId = /^\d+$/.test(g.id);
    const isDuplicate = seen.has(g.id);

    if (isIntegerId || isDuplicate) {
      const newId = generateId();
      if (!idMap.has(g.id)) idMap.set(g.id, newId);
      seen.add(g.id);
      return { ...g, id: newId };
    }

    seen.add(g.id);
    return g;
  });

  if (idMap.size > 0) {
    bets    = bets.map((b)    => ({ ...b, gameId: idMap.get(b.gameId) ?? b.gameId }));
    parlays = parlays.map((p) => ({
      ...p,
      legs: p.legs.map((l) => ({ ...l, gameId: idMap.get(l.gameId) ?? l.gameId })),
    }));
    saveGames();
    saveBets();
    saveParlays();
    console.log(`[MIGRATE] Re-assigned ${idMap.size} duplicate/integer game ID(s)`);
  }
}

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
  if (!token || !adminTokens.has(token)) return false;
  // Reject tokens older than TOKEN_TTL_MS
  if (Date.now() - adminTokens.get(token) > TOKEN_TTL_MS) {
    adminTokens.delete(token);
    saveTokens();
    return false;
  }
  return true;
};

// ── CORS ────────────────────────────────────────────────────────────────────────
// In production set ALLOWED_ORIGINS to a comma-separated list of frontend URLs.
// e.g. ALLOWED_ORIGINS=https://yourbettingsite.com,https://admin.yourbettingsite.com
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

const getCorsHeaders = (origin) => {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    'Vary': 'Origin',
  };
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
  // Specials are always settled manually — never auto-settle
  if (bet.betType === 'special') return 'void';

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
    saveBets();
  }
};

/**
 * Settle parlay legs for a game that has just reached final status.
 * - Any leg on this game is evaluated; if lost → whole parlay lost
 * - If all legs are now settled (won or void), finalize the parlay
 * - Voided legs are removed; if remaining legs ≥ 1 → parlay wins with recalc payout
 * - If all legs voided → parlay is void
 */
const toDecimalOdds = (american) =>
  american > 0 ? (american / 100) + 1 : (100 / Math.abs(american)) + 1;

const toAmericanOdds = (decimal) =>
  decimal >= 2
    ? Math.round((decimal - 1) * 100)
    : Math.round(-100 / (decimal - 1));

const settleGameParlays = (game) => {
  let changed = false;
  parlays = parlays.map((parlay) => {
    if (parlay.status !== 'pending') return parlay;

    const hasLegForGame = parlay.legs.some((leg) => leg.gameId === game.id);
    if (!hasLegForGame) return parlay;

    // Evaluate each leg for this game
    const updatedLegs = parlay.legs.map((leg) => {
      if (leg.gameId !== game.id) return leg;
      const outcome = settleBetOutcome(leg, game); // won / lost / void
      return { ...leg, _outcome: outcome };
    });

    // If any leg lost → parlay is lost
    if (updatedLegs.some((l) => l._outcome === 'lost')) {
      changed = true;
      console.log(`[PARLAY SETTLE] id=${parlay.id} → LOST`);
      const clean = updatedLegs.map(({ _outcome, ...l }) => l);
      return { ...parlay, legs: clean, status: 'lost' };
    }

    // Check if all legs are now resolved (every leg either has _outcome or was already settled from a prior game)
    const allResolved = updatedLegs.every((l) => l._outcome !== undefined || l._settled);
    if (!allResolved) {
      // Some legs are still pending on other games — mark evaluated legs as settled
      const clean = updatedLegs.map(({ _outcome, ...l }) =>
        _outcome ? { ...l, _settled: true, _legOutcome: _outcome } : l
      );
      return { ...parlay, legs: clean };
    }

    // All legs resolved — determine final outcome
    const wonLegs = updatedLegs.filter(
      (l) => l._outcome === 'won' || l._legOutcome === 'won'
    );
    const voidLegs = updatedLegs.filter(
      (l) => l._outcome === 'void' || l._legOutcome === 'void'
    );

    if (wonLegs.length === 0 && voidLegs.length === updatedLegs.length) {
      // All void → parlay void
      changed = true;
      console.log(`[PARLAY SETTLE] id=${parlay.id} → VOID (all legs voided)`);
      const clean = updatedLegs.map(({ _outcome, _settled, _legOutcome, ...l }) => l);
      return { ...parlay, legs: clean, status: 'void' };
    }

    // At least one win, rest void — recalculate payout from surviving legs
    const survivingLegs = [...wonLegs];
    let newPayout;
    if (survivingLegs.length === 1) {
      // Single surviving leg — straight bet payout
      const leg = survivingLegs[0];
      const profit = leg.odds > 0
        ? parlay.stake * (leg.odds / 100)
        : parlay.stake * (100 / Math.abs(leg.odds));
      newPayout = parseFloat((parlay.stake + profit).toFixed(2));
    } else {
      const combined = survivingLegs.reduce((acc, l) => acc * toDecimalOdds(l.odds), 1);
      newPayout = parseFloat((parlay.stake * combined).toFixed(2));
    }

    changed = true;
    console.log(`[PARLAY SETTLE] id=${parlay.id} → WON  payout=$${newPayout}`);
    const clean = updatedLegs.map(({ _outcome, _settled, _legOutcome, ...l }) => l);
    return { ...parlay, legs: clean, status: 'won', payout: newPayout };
  });

  if (changed) saveParlays();
};

// ── Server ──────────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const origin = req.headers['origin'] || '';
  Object.entries(getCorsHeaders(origin)).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  // Parse URL — strip query string, split into parts
  const parsedUrl = new URL(req.url, 'http://localhost');
  const pathname  = parsedUrl.pathname;
  const parts     = pathname.split('/').filter(Boolean);
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
      const ip = req.socket.remoteAddress || 'unknown';
      if (isRateLimited(ip)) {
        res.writeHead(429);
        res.end(JSON.stringify({ error: 'Too many attempts. Try again in 10 minutes.' }));
        return;
      }
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
        resetRateLimit(ip); // clear on success
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
            ? 'Your account has been denied. Please contact admin.'
            : 'Your account is pending verification. Please wait for admin approval.',
          status: user.status,
        }));
      }
      return;
    }

    // ── /admin ────────────────────────────────────────────────────────────────

    // POST /admin/login
    if (req.method === 'POST' && resource === 'admin' && id === 'login') {
      const ip = req.socket.remoteAddress || 'unknown';
      if (isRateLimited(ip)) {
        res.writeHead(429);
        res.end(JSON.stringify({ error: 'Too many attempts. Try again in 10 minutes.' }));
        return;
      }
      const { username, password } = await readBody(req);
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = generateToken();
        adminTokens.set(token, Date.now());
        saveTokens();
        resetRateLimit(ip); // clear on success
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
      if (token) { adminTokens.delete(token); saveTokens(); }
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // POST /admin/verify-password
    if (req.method === 'POST' && resource === 'admin' && id === 'verify-password') {
      if (!validateAdminToken(req)) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      const { password } = await readBody(req);
      if (password === ADMIN_PASSWORD) {
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true }));
      } else {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Incorrect password' }));
      }
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

    // DELETE /admin/users/:userId — permanently remove a denied user account
    if (req.method === 'DELETE' && resource === 'admin' && id === 'users' && subId) {
      if (!validateAdminToken(req)) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      const data = readData(USERS_FILE, { users: [] });
      const before = data.users.length;
      const target = data.users.find((u) => u.id === subId);
      data.users = data.users.filter((u) => u.id !== subId);
      if (data.users.length === before) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'User not found' }));
        return;
      }
      writeData(USERS_FILE, data);
      console.log(`[ADMIN] Removed user: ${target?.firstName} ${target?.lastName}`);
      res.writeHead(204);
      res.end();
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
    // Admin token → all bets. ?userId=<id> → that user's bets only. Else → 403.
    if (req.method === 'GET' && resource === 'bets' && !id) {
      if (validateAdminToken(req)) {
        res.writeHead(200);
        res.end(JSON.stringify(bets));
      } else {
        const userId = parsedUrl.searchParams.get('userId');
        if (!userId) {
          res.writeHead(403);
          res.end(JSON.stringify({ error: 'Forbidden' }));
          return;
        }
        res.writeHead(200);
        res.end(JSON.stringify(bets.filter((b) => b.userId === userId)));
      }
      return;
    }

    // POST /bets — place a bet
    if (req.method === 'POST' && resource === 'bets' && !id) {
      const { gameId, betType, side, label, odds, stake, line, specialId, cashAmount, userName, userId } = await readBody(req);

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

      // Game-level guards
      const betGame = games.find((g) => g.id === gameId);
      if (!betGame) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Game not found' }));
        return;
      }
      if (betGame.bettingEnabled === false) {
        res.writeHead(403);
        res.end(JSON.stringify({ error: 'Betting is currently closed for this game' }));
        return;
      }
      if (betGame.lockedSides?.[side]) {
        res.writeHead(403);
        res.end(JSON.stringify({ error: 'Betting on this side is currently locked' }));
        return;
      }
      const sideLimit = betGame.betLimits?.[side];
      if (sideLimit && stake > sideLimit.maxStake) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: `Maximum stake for these odds is $${sideLimit.maxStake.toFixed(2)}` }));
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
        ...(line     != null ? { line }      : {}),
        ...(specialId       ? { specialId }  : {}),
        stake,
        cashAmount,
        payout,
        userId: userId || '',
        userName: userName || 'Unknown',
        status: 'awaiting_payment',
        placedAt: new Date().toISOString(),
      };

      bets.unshift(bet);
      saveBets();
      // No balance deduction — payment confirmed in cash by admin
      console.log(`[BET]    ${label} @ ${odds > 0 ? '+' : ''}${odds}  stake=$${stake}  cash=$${cashAmount}  status=awaiting_payment`);
      res.writeHead(201);
      res.end(JSON.stringify({ bet }));
      return;
    }

    // POST /bets/:id/confirm-payment — admin confirms cash received, activates bet
    if (req.method === 'POST' && resource === 'bets' && id && subId === 'confirm-payment') {
      if (!validateAdminToken(req)) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      const betIdx = bets.findIndex((b) => b.id === id);
      if (betIdx === -1) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Bet not found' }));
        return;
      }
      if (bets[betIdx].status !== 'awaiting_payment') {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Bet is not awaiting payment' }));
        return;
      }
      bets[betIdx] = { ...bets[betIdx], status: 'pending' };
      saveBets();
      console.log(`[CONFIRM] Bet ${id} → pending (cash confirmed)`);
      res.writeHead(200);
      res.end(JSON.stringify({ bet: bets[betIdx] }));
      return;
    }

    // POST /bets/:id/settle — admin manually marks a pending bet won/lost/void
    if (req.method === 'POST' && resource === 'bets' && id && subId === 'settle') {
      if (!validateAdminToken(req)) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      const { outcome } = await readBody(req);
      if (!['won', 'lost', 'void'].includes(outcome)) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'outcome must be won, lost, or void' }));
        return;
      }
      const betIdx = bets.findIndex((b) => b.id === id);
      if (betIdx === -1) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Bet not found' }));
        return;
      }
      if (bets[betIdx].status !== 'pending') {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Only pending bets can be manually settled' }));
        return;
      }
      bets[betIdx] = { ...bets[betIdx], status: outcome };
      saveBets();
      console.log(`[SETTLE] Manual: bet ${id} → ${outcome.toUpperCase()}  (${bets[betIdx].label})`);
      res.writeHead(200);
      res.end(JSON.stringify({ bet: bets[betIdx] }));
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
      saveBets();
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
      game.id = generateId(); // server always owns the ID — prevents client collisions
      game.bettingEnabled = true; // auto-enable betting when a game is created
      games.unshift(game);
      saveGames();
      console.log(`[ADD]    ${game.awayTeam} @ ${game.homeTeam} (${game.league})`);
      res.writeHead(201);
      res.end(JSON.stringify(game));
      return;
    }

    // PUT /games/:id
    if (req.method === 'PUT' && resource === 'games' && id) {
      const updates = await readBody(req);
      // auto-disable betting when a game goes live (admin can re-enable manually)
      const existing = games.find((g) => g.id === id);
      if (updates.status === 'live' && existing && existing.status !== 'live') {
        updates.bettingEnabled = false;
      }
      games = games.map((g) => (g.id === id ? { ...g, ...updates } : g));
      const updated = games.find((g) => g.id === id);
      if (!updated) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Game not found' }));
        return;
      }
      saveGames();
      console.log(`[UPDATE] id=${id}`, Object.keys(updates).join(', '));

      if (
        updated.status === 'final' &&
        updated.homeScore !== undefined &&
        updated.awayScore !== undefined
      ) {
        settleGameBets(updated);
        settleGameParlays(updated);
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
      saveGames();
      console.log(`[REMOVE] id=${id}`);
      res.writeHead(204);
      res.end();
      return;
    }

    // POST /games/:id/void-bets
    if (req.method === 'POST' && resource === 'games' && id && subId === 'void-bets') {
      if (!validateAdminToken(req)) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      const voidGame = games.find((g) => g.id === id);
      if (!voidGame) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Game not found' }));
        return;
      }
      let voidedCount = 0;
      bets = bets.map((bet) => {
        if (bet.gameId !== id) return bet;
        if (bet.status === 'awaiting_payment') {
          voidedCount++;
          console.log(`[VOID] ${bet.label} → VOID (payment not confirmed)`);
          return { ...bet, status: 'void' };
        }
        if (bet.status === 'pending') {
          voidedCount++;
          console.log(`[VOID] ${bet.label} → VOID`);
          return { ...bet, status: 'void' };
        }
        return bet;
      });
      saveBets();
      console.log(`[VOID] ${voidedCount} bet(s) voided for game ${id}`);
      res.writeHead(200);
      res.end(JSON.stringify({ voided: voidedCount }));
      return;
    }

    // ── /settings ─────────────────────────────────────────────────────────────

    // GET /settings — admin only
    if (req.method === 'GET' && resource === 'settings' && !id) {
      if (!validateAdminToken(req)) { res.writeHead(401); res.end(JSON.stringify({ error: 'Unauthorized' })); return; }
      res.writeHead(200);
      res.end(JSON.stringify(settings));
      return;
    }

    // PUT /settings — admin only
    if (req.method === 'PUT' && resource === 'settings' && !id) {
      if (!validateAdminToken(req)) { res.writeHead(401); res.end(JSON.stringify({ error: 'Unauthorized' })); return; }
      const updates = await readBody(req);
      settings = { ...settings, ...updates };
      saveSettings();
      console.log(`[SETTINGS] Updated: ${JSON.stringify(settings)}`);
      res.writeHead(200);
      res.end(JSON.stringify(settings));
      return;
    }

    // ── /parlays ──────────────────────────────────────────────────────────────

    // GET /parlays — admin token → all; ?userId=<id> → user's parlays
    if (req.method === 'GET' && resource === 'parlays' && !id) {
      if (validateAdminToken(req)) {
        res.writeHead(200);
        res.end(JSON.stringify(parlays));
      } else {
        const userId = parsedUrl.searchParams.get('userId');
        if (!userId) {
          res.writeHead(403);
          res.end(JSON.stringify({ error: 'Forbidden' }));
          return;
        }
        res.writeHead(200);
        res.end(JSON.stringify(parlays.filter((p) => p.userId === userId)));
      }
      return;
    }

    // POST /parlays — place a parlay
    if (req.method === 'POST' && resource === 'parlays' && !id) {
      const { legs, combinedOdds, stake, cashAmount, userId, userName } = await readBody(req);

      if (!legs || !Array.isArray(legs) || legs.length < 2) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Parlay requires at least 2 legs' }));
        return;
      }
      if (legs.length > 8) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Parlay cannot exceed 8 legs' }));
        return;
      }
      if (combinedOdds == null || !stake || typeof stake !== 'number' || stake <= 0) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing required fields' }));
        return;
      }

      // Payout = stake × decimal conversion of combinedOdds
      const combinedDecimal = combinedOdds > 0
        ? (combinedOdds / 100) + 1
        : (100 / Math.abs(combinedOdds)) + 1;
      const payout = parseFloat((stake * combinedDecimal).toFixed(2));

      if (payout > settings.parlayMaxPayout) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: `Parlay payout cannot exceed $${settings.parlayMaxPayout}. Reduce your stake or legs.` }));
        return;
      }
      if (settings.parlayMaxStake !== null && stake > settings.parlayMaxStake) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: `Maximum parlay stake is $${settings.parlayMaxStake}.` }));
        return;
      }

      const parlay = {
        id: generateId(),
        userId: userId || '',
        userName: userName || 'Unknown',
        legs,
        combinedOdds,
        stake,
        payout,
        cashAmount: cashAmount ?? stake,
        status: 'awaiting_payment',
        placedAt: new Date().toISOString(),
      };

      parlays.unshift(parlay);
      saveParlays();
      console.log(`[PARLAY] ${legs.length}-leg  odds=${combinedOdds > 0 ? '+' : ''}${combinedOdds}  stake=$${stake}  payout=$${payout}`);
      res.writeHead(201);
      res.end(JSON.stringify({ parlay }));
      return;
    }

    // POST /parlays/:id/confirm-payment
    if (req.method === 'POST' && resource === 'parlays' && id && subId === 'confirm-payment') {
      if (!validateAdminToken(req)) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      const idx = parlays.findIndex((p) => p.id === id);
      if (idx === -1) { res.writeHead(404); res.end(JSON.stringify({ error: 'Parlay not found' })); return; }
      if (parlays[idx].status !== 'awaiting_payment') {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Parlay is not awaiting payment' }));
        return;
      }
      parlays[idx] = { ...parlays[idx], status: 'pending' };
      saveParlays();
      console.log(`[PARLAY CONFIRM] id=${id} → pending`);
      res.writeHead(200);
      res.end(JSON.stringify({ parlay: parlays[idx] }));
      return;
    }

    // POST /parlays/:id/settle — admin manually settles
    if (req.method === 'POST' && resource === 'parlays' && id && subId === 'settle') {
      if (!validateAdminToken(req)) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      const { outcome } = await readBody(req);
      if (!['won', 'lost', 'void'].includes(outcome)) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'outcome must be won, lost, or void' }));
        return;
      }
      const idx = parlays.findIndex((p) => p.id === id);
      if (idx === -1) { res.writeHead(404); res.end(JSON.stringify({ error: 'Parlay not found' })); return; }
      if (parlays[idx].status !== 'pending') {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Only pending parlays can be manually settled' }));
        return;
      }
      parlays[idx] = { ...parlays[idx], status: outcome };
      saveParlays();
      console.log(`[PARLAY SETTLE] Manual: id=${id} → ${outcome.toUpperCase()}`);
      res.writeHead(200);
      res.end(JSON.stringify({ parlay: parlays[idx] }));
      return;
    }

    // DELETE /parlays/:id
    if (req.method === 'DELETE' && resource === 'parlays' && id) {
      if (!validateAdminToken(req)) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      const before = parlays.length;
      parlays = parlays.filter((p) => p.id !== id);
      if (parlays.length === before) { res.writeHead(404); res.end(JSON.stringify({ error: 'Parlay not found' })); return; }
      saveParlays();
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
  console.log('  Admin user   →  ADMIN_USERNAME env var (default: admin)');
  console.log('  Admin pass   →  ADMIN_PASSWORD env var (required in production)');
  console.log('  CORS origins →  ALLOWED_ORIGINS env var (default: localhost:3000,3001)');
  console.log('  User data    →  infra/users.json  (created on first sign-up)');
  console.log('  Sign-in log  →  infra/signin-log.json');
  console.log('');
});

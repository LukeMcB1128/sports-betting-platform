export type GameStatus = 'upcoming' | 'live' | 'resolving' | 'final';

export interface BetSideLimit {
  maxStake: number;
  maxPayout: number;
}

export interface BetLimits {
  home: BetSideLimit;
  away: BetSideLimit;
}

export interface LockedSides {
  home: boolean;
  away: boolean;
}

export type BetType = 'moneyline' | 'spread' | 'special';

export type BetSide = 'home' | 'away' | 'yes' | 'no';

export type BetStatus = 'awaiting_payment' | 'pending' | 'won' | 'lost' | 'void';

export interface Special {
  id: string;
  question: string; // e.g. "Paul knocks out James first round"
  yesOdds: number;  // e.g. +200
  noOdds: number;   // e.g. -250
}

export interface Bet {
  id: string;
  gameId: string;
  betType: BetType;
  side: BetSide;
  label: string;    // e.g. "Kansas City Chiefs -3.5"
  odds: number;     // e.g. -110 (the juice / price)
  line?: number;    // spread line at time of bet, e.g. -3.5 (spread bets only)
  specialId?: string; // which special this bet is on (betType === 'special' only)
  stake: number;    // amount wagered
  payout: number;   // total payout on win (stake + profit)
  userId: string;
  userName: string;
  status: BetStatus;
  placedAt: string; // ISO string
}

export interface MoneylineOdds {
  home: number;
  away: number;
}

export interface SpreadSide {
  line: number;  // e.g. -3.5
  juice: number; // e.g. -110
}

export interface SpreadOdds {
  home: SpreadSide;
  away: SpreadSide;
}

export interface GameOdds {
  moneyline: MoneylineOdds;
  spread: SpreadOdds;
}

export interface Game {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string; // ISO string
  status: GameStatus;
  published: boolean;
  homeScore?: number;
  awayScore?: number;
  odds: GameOdds;
  bettingEnabled?: boolean; // undefined treated as true for backward compat
  betLimits?: BetLimits;
  lockedSides?: LockedSides;
  specials?: Special[];
  eventId?: string;
}

// ─── Parlays ──────────────────────────────────────────────────────────────────

export interface ParlayLeg {
  gameId: string;
  betType: BetType;
  side: BetSide;
  label: string;
  odds: number;       // American odds for this leg
  line?: number;
}

export interface Parlay {
  id: string;
  userId: string;
  userName: string;
  legs: ParlayLeg[];
  combinedOdds: number;  // American, already house-edge-adjusted
  stake: number;
  payout: number;
  status: 'awaiting_payment' | 'pending' | 'won' | 'lost' | 'void';
  placedAt: string;      // ISO string
}

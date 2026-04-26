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

export type BetType = 'moneyline' | 'spread';

export type BetSide = 'home' | 'away';

export type BetStatus = 'awaiting_payment' | 'pending' | 'won' | 'lost' | 'void';

export interface Bet {
  id: string;
  gameId: string;
  betType: BetType;
  side: BetSide;
  label: string;    // e.g. "Kansas City Chiefs -3.5"
  odds: number;     // e.g. -110 (the juice / price)
  line?: number;    // spread line at time of bet, e.g. -3.5 (spread bets only)
  stake: number;    // amount wagered (declared cash amount)
  payout: number;   // total payout on win (stake + profit)
  cashAmount: number; // cash the user declared they are handing over
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
  cashAmount: number;
  status: 'awaiting_payment' | 'pending' | 'won' | 'lost' | 'void';
  placedAt: string;      // ISO string
}

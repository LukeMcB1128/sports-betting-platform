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
  question: string;
  yesOdds: number;
  noOdds: number;
}

export interface Bet {
  id: string;
  gameId: string;
  betType: BetType;
  side: BetSide;
  label: string;
  odds: number;
  line?: number;
  specialId?: string;
  stake: number;
  payout: number;
  cashAmount: number; // cash declared by user at submission
  userId: string;
  userName: string;
  status: BetStatus;
  placedAt: string; // ISO string
}

export interface SpreadSide {
  line: number;
  juice: number;
}

export interface GameOdds {
  moneyline: {
    home: number;
    away: number;
  };
  spread: {
    home: SpreadSide;
    away: SpreadSide;
  };
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
  bettingEnabled: boolean;
  betLimits?: BetLimits;
  lockedSides?: LockedSides;
  specials?: Special[];
}

// ─── Parlays ──────────────────────────────────────────────────────────────────

export interface ParlayLeg {
  gameId: string;
  betType: BetType;
  side: BetSide;
  label: string;
  odds: number;
  line?: number;
}

export interface Parlay {
  id: string;
  userId: string;
  userName: string;
  legs: ParlayLeg[];
  combinedOdds: number;
  stake: number;
  payout: number;
  cashAmount: number;
  status: 'awaiting_payment' | 'pending' | 'won' | 'lost' | 'void';
  placedAt: string;
}

// Form shapes (all strings before parsing)
export interface AddGameFormData {
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startDate: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  // Opening lines
  mlAway: string;
  mlHome: string;
  spreadAwayLine: string;
  spreadAwayJuice: string;
  spreadHomeLine: string;
  spreadHomeJuice: string;
}

export interface SetLinesFormData {
  mlHome: string;
  mlAway: string;
  spreadHomeLine: string;
  spreadHomeJuice: string;
  spreadAwayLine: string;
  spreadAwayJuice: string;
}

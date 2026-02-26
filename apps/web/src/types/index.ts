export type GameStatus = 'upcoming' | 'live' | 'resolving' | 'final';

export type BetType = 'moneyline' | 'spread';

export type BetSide = 'home' | 'away';

export type BetStatus = 'pending' | 'won' | 'lost' | 'void';

export interface Bet {
  id: string;
  gameId: string;
  betType: BetType;
  side: BetSide;
  label: string;    // e.g. "Kansas City Chiefs -3.5"
  odds: number;     // e.g. -110
  stake: number;    // amount wagered
  payout: number;   // total payout on win (stake + profit)
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
}

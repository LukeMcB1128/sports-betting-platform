export type GameStatus = 'upcoming' | 'live' | 'final';

export type BetType = 'moneyline' | 'spread';

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

import { Bet, BetType, BetSide } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3002';

export interface PlaceBetPayload {
  gameId: string;
  betType: BetType;
  side: BetSide;
  label: string;
  odds: number;
  line?: number;  // spread line at placement time (spread bets only)
  stake: number;
}

export interface PlaceBetResponse {
  bet: Bet;
  balance: number;
}

export const getBalance = async (): Promise<number> => {
  const res = await fetch(`${API_BASE}/balance`);
  if (!res.ok) throw new Error('Failed to fetch balance');
  const data = await res.json();
  return data.balance as number;
};

export const placeBet = async (payload: PlaceBetPayload): Promise<PlaceBetResponse> => {
  const res = await fetch(`${API_BASE}/bets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error ?? 'Failed to place bet');
  }
  return res.json();
};

export const getBets = async (): Promise<Bet[]> => {
  const res = await fetch(`${API_BASE}/bets`);
  if (!res.ok) throw new Error('Failed to fetch bets');
  return res.json();
};

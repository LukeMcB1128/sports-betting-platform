import { Bet } from '../types';

const API_BASE = 'http://localhost:3002';

export const fetchBets = async (): Promise<Bet[]> => {
  const res = await fetch(`${API_BASE}/bets`);
  if (!res.ok) throw new Error('Failed to fetch bets');
  return res.json();
};

import { Bet } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3002';

export const fetchBets = async (adminToken: string): Promise<Bet[]> => {
  const res = await fetch(`${API_BASE}/bets`, {
    headers: { 'X-Admin-Token': adminToken },
  });
  if (!res.ok) throw new Error(`Failed to fetch bets (${res.status})`);
  return res.json();
};

export const deleteBet = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/bets/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error('Failed to delete bet');
};

export const confirmPayment = async (id: string, adminToken: string): Promise<Bet> => {
  const res = await fetch(`${API_BASE}/bets/${id}/confirm-payment`, {
    method: 'POST',
    headers: { 'X-Admin-Token': adminToken },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error ?? 'Failed to confirm payment');
  }
  const data = await res.json();
  return data.bet;
};

export const settleBet = async (
  id: string,
  outcome: 'won' | 'lost' | 'void',
  adminToken: string,
): Promise<Bet> => {
  const res = await fetch(`${API_BASE}/bets/${id}/settle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': adminToken,
    },
    body: JSON.stringify({ outcome }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error ?? 'Failed to settle bet');
  }
  const data = await res.json();
  return data.bet;
};

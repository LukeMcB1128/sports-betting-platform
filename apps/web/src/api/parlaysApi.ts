import { Parlay, ParlayLeg } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3002';

export interface PlaceParlayPayload {
  legs: ParlayLeg[];
  combinedOdds: number;
  stake: number;
  cashAmount: number;
  userId: string;
  userName: string;
}

export const getParlays = async (userId: string): Promise<Parlay[]> => {
  const res = await fetch(`${API_BASE}/parlays?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch parlays');
  return res.json();
};

export const placeParlay = async (payload: PlaceParlayPayload): Promise<{ parlay: Parlay }> => {
  const res = await fetch(`${API_BASE}/parlays`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error ?? 'Failed to place parlay');
  }
  return res.json();
};

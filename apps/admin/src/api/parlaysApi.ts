import { Parlay } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3002';

export const fetchParlays = async (adminToken: string): Promise<Parlay[]> => {
  const res = await fetch(`${API_BASE}/parlays`, {
    headers: { 'X-Admin-Token': adminToken },
  });
  if (!res.ok) throw new Error(`Failed to fetch parlays (${res.status})`);
  return res.json();
};

export const confirmParlayPayment = async (id: string, adminToken: string): Promise<Parlay> => {
  const res = await fetch(`${API_BASE}/parlays/${id}/confirm-payment`, {
    method: 'POST',
    headers: { 'X-Admin-Token': adminToken },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error ?? 'Failed to confirm parlay payment');
  }
  const data = await res.json();
  return data.parlay;
};

export const settleParlay = async (
  id: string,
  outcome: 'won' | 'lost' | 'void',
  adminToken: string,
): Promise<Parlay> => {
  const res = await fetch(`${API_BASE}/parlays/${id}/settle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken },
    body: JSON.stringify({ outcome }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error ?? 'Failed to settle parlay');
  }
  const data = await res.json();
  return data.parlay;
};

export const deleteParlay = async (id: string, adminToken: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/parlays/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Token': adminToken },
  });
  if (!res.ok && res.status !== 404) throw new Error('Failed to delete parlay');
};

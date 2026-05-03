import { Event } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3002';

export const fetchEvents = async (adminToken: string): Promise<Event[]> => {
  const res = await fetch(`${API_BASE}/events`, {
    headers: { 'X-Admin-Token': adminToken },
  });
  if (!res.ok) throw new Error(`Failed to fetch events (${res.status})`);
  return res.json();
};

export const createEvent = async (
  adminToken: string,
  data: { name: string; date: string; description?: string },
): Promise<Event> => {
  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error ?? 'Failed to create event');
  }
  return res.json();
};

export const updateEvent = async (
  adminToken: string,
  id: string,
  updates: Partial<Event>,
): Promise<Event> => {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error ?? 'Failed to update event');
  }
  return res.json();
};

export const deleteEvent = async (adminToken: string, id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Token': adminToken },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error ?? 'Failed to delete event');
  }
};

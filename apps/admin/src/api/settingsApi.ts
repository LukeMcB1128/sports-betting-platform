const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3002';

export interface AppSettings {
  parlayMaxPayout: number;
  parlayMaxStake: number | null;
}

export const fetchSettings = async (adminToken: string): Promise<AppSettings> => {
  const res = await fetch(`${API_BASE}/settings`, {
    headers: { 'X-Admin-Token': adminToken },
  });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
};

export const saveSettings = async (
  adminToken: string,
  updates: Partial<AppSettings>
): Promise<AppSettings> => {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': adminToken,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
};

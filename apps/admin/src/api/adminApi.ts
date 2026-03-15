const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3002';

export const verifyAdminPassword = async (password: string, adminToken: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/admin/verify-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any).error || 'Incorrect password');
  }
};

const API = 'http://localhost:3002';

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  status: 'pending' | 'verified' | 'denied';
  createdAt: string;
}

export interface SignInLogEntry {
  id: string;
  name: string;
  timestamp: string;
  success: boolean;
  reason: string;
  userId?: string;
}

const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'X-Admin-Token': token,
});

export async function adminLogin(
  username: string,
  password: string,
): Promise<{ token?: string; error?: string }> {
  try {
    const res = await fetch(`${API}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error };
    return { token: data.token };
  } catch {
    return { error: 'Cannot connect to server. Is the dev server running?' };
  }
}

export async function adminLogout(token: string): Promise<void> {
  await fetch(`${API}/admin/logout`, {
    method: 'POST',
    headers: authHeaders(token),
  });
}

export async function fetchUsers(token: string): Promise<AdminUser[]> {
  const res = await fetch(`${API}/admin/users`, {
    headers: { 'X-Admin-Token': token },
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function updateUserStatus(
  token: string,
  userId: string,
  status: 'verified' | 'denied' | 'pending',
): Promise<AdminUser> {
  const res = await fetch(`${API}/admin/users/${userId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update user status');
  return res.json();
}

export async function fetchSignInLog(token: string): Promise<SignInLogEntry[]> {
  const res = await fetch(`${API}/admin/signin-log`, {
    headers: { 'X-Admin-Token': token },
  });
  if (!res.ok) throw new Error('Failed to fetch sign-in log');
  return res.json();
}

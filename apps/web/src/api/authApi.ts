const API = 'http://localhost:3002';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
}

export async function signUp(
  firstName: string,
  lastName: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, password }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch {
    return { success: false, error: 'Cannot connect to server. Is the dev server running?' };
  }
}

export async function signIn(
  firstName: string,
  lastName: string,
  password: string,
): Promise<{ success: boolean; user?: AuthUser; error?: string; status?: string }> {
  try {
    const res = await fetch(`${API}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, password }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error, status: data.status };
    return { success: true, user: data.user };
  } catch {
    return { success: false, error: 'Cannot connect to server. Is the dev server running?' };
  }
}

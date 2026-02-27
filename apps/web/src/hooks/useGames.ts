import { useState, useEffect } from 'react';
import { Game } from '../types';

const API_BASE = 'http://localhost:3002';
const POLL_INTERVAL_MS = 3000;

/**
 * Fetches games from the shared dev API server (infra/dev-server.js) and
 * re-polls every 3 seconds so the homepage stays in sync with admin changes.
 *
 * Falls back to `fallback` if the dev server is not reachable.
 * Swap the fetch call for your real API endpoint when the .NET backend is ready.
 */
const useGames = (fallback: Game[]): Game[] => {
  const [games, setGames] = useState<Game[]>(fallback);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/games`);
        if (res.ok && !cancelled) {
          const data: Game[] = await res.json();
          setGames(data);
        }
      } catch {
        // Dev server not running — keep current state (fallback on first run)
      }
    };

    poll(); // fetch immediately on mount
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return games;
};

export default useGames;

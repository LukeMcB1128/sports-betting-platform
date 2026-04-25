import { useState, useEffect } from 'react';
import { Bet } from '../types';
import { getBets } from '../api/betsApi';

const POLL_INTERVAL_MS = 3000;

/**
 * Fetches placed bets from the shared dev API server and re-polls every 3 seconds
 * so the My Bets page stays live.
 *
 * Swap the fetch call for your real API endpoint when the .NET backend is ready.
 */
const useBets = (userId: string): Bet[] => {
  const [bets, setBets] = useState<Bet[]>([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await getBets(userId);
        if (!cancelled) setBets(data);
      } catch {
        // Dev server not running — keep current state
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId]);

  return bets;
};

export default useBets;

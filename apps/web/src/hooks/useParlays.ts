import { useState, useEffect } from 'react';
import { Parlay } from '../types';
import { getParlays } from '../api/parlaysApi';

const POLL_MS = 10000;

const useParlays = (userId: string): Parlay[] => {
  const [parlays, setParlays] = useState<Parlay[]>([]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const load = async () => {
      try {
        const data = await getParlays(userId);
        if (!cancelled) setParlays(data);
      } catch {
        // silently ignore — stale data is fine
      }
    };

    load();
    const interval = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [userId]);

  return parlays;
};

export default useParlays;

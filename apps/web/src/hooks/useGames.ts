import { useState, useEffect } from 'react';
import { Game } from '../types';

export const GAMES_STORAGE_KEY = 'sbp_games';

const readGames = (): Game[] | null => {
  try {
    const raw = localStorage.getItem(GAMES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Game[]) : null;
  } catch {
    return null;
  }
};

/**
 * Returns the current games list sourced from localStorage (written by the admin app).
 * Automatically re-renders when the admin makes changes in another tab via the
 * browser's native `storage` event.
 */
const useGames = (fallback: Game[]): Game[] => {
  const [games, setGames] = useState<Game[]>(() => readGames() ?? fallback);

  useEffect(() => {
    // Sync if localStorage already has data when the web app first mounts
    const stored = readGames();
    if (stored) setGames(stored);

    // Re-render whenever the admin writes to localStorage from another tab
    const handleStorage = (e: StorageEvent) => {
      if (e.key === GAMES_STORAGE_KEY) {
        try {
          const updated = e.newValue ? (JSON.parse(e.newValue) as Game[]) : [];
          setGames(updated);
        } catch {
          // ignore malformed data
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return games;
};

export default useGames;

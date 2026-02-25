import { Game } from '../types';

export const GAMES_STORAGE_KEY = 'sbp_games';

export const persistGames = (games: Game[]): void => {
  localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(games));
};

export const loadGames = (): Game[] | null => {
  try {
    const raw = localStorage.getItem(GAMES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Game[]) : null;
  } catch {
    return null;
  }
};

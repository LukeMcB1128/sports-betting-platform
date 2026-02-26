import { Game, GameOdds, GameStatus } from '../types';

const API_BASE = 'http://localhost:3002';

export const fetchGames = async (): Promise<Game[]> => {
  const res = await fetch(`${API_BASE}/games`);
  if (!res.ok) throw new Error('Failed to fetch games');
  return res.json();
};

export const createGame = async (game: Game): Promise<Game> => {
  const res = await fetch(`${API_BASE}/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(game),
  });
  if (!res.ok) throw new Error('Failed to create game');
  return res.json();
};

export const updateGameStatus = async (id: string, status: GameStatus): Promise<Game> => {
  const res = await fetch(`${API_BASE}/games/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update game status');
  return res.json();
};

export const updateGameOdds = async (id: string, odds: GameOdds): Promise<Game> => {
  const res = await fetch(`${API_BASE}/games/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ odds }),
  });
  if (!res.ok) throw new Error('Failed to update game odds');
  return res.json();
};

export const togglePublishGame = async (id: string, published: boolean): Promise<Game> => {
  const res = await fetch(`${API_BASE}/games/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ published }),
  });
  if (!res.ok) throw new Error('Failed to update game visibility');
  return res.json();
};

export const updateGameScore = async (
  id: string,
  awayScore: number,
  homeScore: number,
): Promise<Game> => {
  const res = await fetch(`${API_BASE}/games/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ awayScore, homeScore }),
  });
  if (!res.ok) throw new Error('Failed to update game score');
  return res.json();
};

export const updateBettingEnabled = async (id: string, bettingEnabled: boolean): Promise<Game> => {
  const res = await fetch(`${API_BASE}/games/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bettingEnabled }),
  });
  if (!res.ok) throw new Error('Failed to update betting status');
  return res.json();
};

export const removeGame = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/games/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove game');
};

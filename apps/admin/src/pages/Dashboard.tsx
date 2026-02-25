import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Game, GameStatus, GameOdds } from '../types';
import { colors } from '../styles/GlobalStyles';
import GamesTable from '../components/GamesTable';
import AddGameModal from '../components/AddGameModal';
import SetLinesModal from '../components/SetLinesModal';
import Button from '../components/Button';
import { persistGames, loadGames } from '../utils/gamesStorage';

const INITIAL_GAMES: Game[] = [
  {
    id: '1',
    sport: 'basketball',
    league: 'NBA',
    awayTeam: 'Boston Celtics',
    homeTeam: 'Miami Heat',
    startTime: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
    status: 'upcoming',
    odds: {
      moneyline: { away: -160, home: +135 },
      spread: {
        away: { line: -3.5, juice: -110 },
        home: { line: +3.5, juice: -110 },
      },
    },
  },
  {
    id: '2',
    sport: 'basketball',
    league: 'NBA',
    awayTeam: 'Golden State Warriors',
    homeTeam: 'Los Angeles Lakers',
    startTime: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    status: 'live',
    awayScore: 58,
    homeScore: 54,
    odds: {
      moneyline: { away: -120, home: +100 },
      spread: {
        away: { line: -1.5, juice: -110 },
        home: { line: +1.5, juice: -110 },
      },
    },
  },
];

const Page = styled.main`
  max-width: 1100px;
  margin: 0 auto;
  padding: 28px 20px;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.text};
`;

const StatsRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const StatCard = styled.div`
  background-color: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: 8px;
  padding: 14px 20px;
  min-width: 120px;
`;

const StatValue = styled.div`
  font-size: 26px;
  font-weight: 700;
  color: ${colors.text};
  line-height: 1;
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
`;

const Dashboard: React.FC = () => {
  // Seed from localStorage if available, otherwise use hardcoded defaults
  const [games, setGames] = useState<Game[]>(() => loadGames() ?? INITIAL_GAMES);
  const [showAddGame, setShowAddGame] = useState(false);
  const [editLinesGame, setEditLinesGame] = useState<Game | null>(null);

  // Persist to localStorage whenever games change
  useEffect(() => {
    persistGames(games);
  }, [games]);

  const handleAddGame = (game: Game) => {
    setGames((prev) => [game, ...prev]);
  };

  const handleUpdateStatus = (gameId: string, status: GameStatus) => {
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, status } : g))
    );
  };

  const handleSaveLines = (gameId: string, odds: GameOdds) => {
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, odds } : g))
    );
  };

  const handleRemove = (gameId: string) => {
    setGames((prev) => prev.filter((g) => g.id !== gameId));
  };

  const liveCount = games.filter((g) => g.status === 'live').length;
  const upcomingCount = games.filter((g) => g.status === 'upcoming').length;
  const finalCount = games.filter((g) => g.status === 'final').length;

  return (
    <Page>
      <PageHeader>
        <PageTitle>Games</PageTitle>
        <Button variant="primary" onClick={() => setShowAddGame(true)}>
          + Add Game
        </Button>
      </PageHeader>

      <StatsRow>
        <StatCard>
          <StatValue>{games.length}</StatValue>
          <StatLabel>Total</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue style={{ color: colors.live }}>{liveCount}</StatValue>
          <StatLabel>Live</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{upcomingCount}</StatValue>
          <StatLabel>Upcoming</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue style={{ color: colors.textMuted }}>{finalCount}</StatValue>
          <StatLabel>Final</StatLabel>
        </StatCard>
      </StatsRow>

      <GamesTable
        games={games}
        onSetLines={setEditLinesGame}
        onUpdateStatus={handleUpdateStatus}
        onUpdateOdds={handleSaveLines}
        onRemove={handleRemove}
      />

      {showAddGame && (
        <AddGameModal
          onClose={() => setShowAddGame(false)}
          onAdd={handleAddGame}
        />
      )}

      {editLinesGame && (
        <SetLinesModal
          game={editLinesGame}
          onClose={() => setEditLinesGame(null)}
          onSave={handleSaveLines}
        />
      )}
    </Page>
  );
};

export default Dashboard;

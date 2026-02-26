import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Game, GameStatus, GameOdds } from '../types';
import { colors } from '../styles/GlobalStyles';
import GamesTable from '../components/GamesTable';
import AddGameModal from '../components/AddGameModal';
import SetLinesModal from '../components/SetLinesModal';
import EnterScoreModal from '../components/EnterScoreModal';
import Button from '../components/Button';
import {
  fetchGames,
  createGame,
  updateGameStatus,
  updateGameOdds,
  togglePublishGame,
  updateGameScore,
  removeGame,
} from '../api/gamesApi';

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

const Banner = styled.div<{ variant: 'error' | 'loading' }>`
  background-color: ${({ variant }) => variant === 'error' ? '#3b1212' : colors.surfaceHover};
  border: 1px solid ${({ variant }) => variant === 'error' ? colors.danger : colors.border};
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 24px;
  font-size: 13px;
  color: ${({ variant }) => variant === 'error' ? colors.danger : colors.textMuted};
`;

const Dashboard: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddGame, setShowAddGame] = useState(false);
  const [editLinesGame, setEditLinesGame] = useState<Game | null>(null);
  const [enterScoreGame, setEnterScoreGame] = useState<Game | null>(null);

  useEffect(() => {
    fetchGames()
      .then(setGames)
      .catch(() => setError('Cannot connect to dev server. Run: node infra/dev-server.js'))
      .finally(() => setLoading(false));
  }, []);

  const handleAddGame = async (game: Game) => {
    await createGame(game);
    setGames((prev) => [game, ...prev]);
  };

  const handleUpdateStatus = async (gameId: string, status: GameStatus) => {
    await updateGameStatus(gameId, status);
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, status } : g))
    );
  };

  const handleSaveLines = async (gameId: string, odds: GameOdds) => {
    await updateGameOdds(gameId, odds);
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, odds } : g))
    );
  };

  const handleTogglePublish = async (gameId: string, published: boolean) => {
    await togglePublishGame(gameId, published);
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, published } : g))
    );
  };

  const handleRemove = async (gameId: string) => {
    await removeGame(gameId);
    setGames((prev) => prev.filter((g) => g.id !== gameId));
  };

  const handleEnterScore = async (gameId: string, awayScore: number, homeScore: number) => {
    await updateGameScore(gameId, awayScore, homeScore);
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, awayScore, homeScore } : g))
    );
  };

  const upcomingCount = games.filter((g) => g.status === 'upcoming').length;
  const liveCount = games.filter((g) => g.status === 'live').length;
  const resolvingCount = games.filter((g) => g.status === 'resolving').length;
  const finalCount = games.filter((g) => g.status === 'final').length;

  return (
    <Page>
      <PageHeader>
        <PageTitle>Games</PageTitle>
        <Button variant="primary" onClick={() => setShowAddGame(true)} disabled={!!error}>
          + Add Game
        </Button>
      </PageHeader>

      {loading && <Banner variant="loading">Loading games from dev server…</Banner>}
      {error && <Banner variant="error">{error}</Banner>}

      {!loading && !error && (
        <StatsRow>
          <StatCard>
            <StatValue>{games.length}</StatValue>
            <StatLabel>Total</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{upcomingCount}</StatValue>
            <StatLabel>Upcoming</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue style={{ color: colors.live }}>{liveCount}</StatValue>
            <StatLabel>Live</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{resolvingCount}</StatValue>
            <StatLabel>Resolving</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue style={{ color: colors.textMuted }}>{finalCount}</StatValue>
            <StatLabel>Final</StatLabel>
          </StatCard>
        </StatsRow>
      )}

      <GamesTable
        games={games}
        onSetLines={setEditLinesGame}
        onUpdateStatus={handleUpdateStatus}
        onUpdateOdds={handleSaveLines}
        onTogglePublish={handleTogglePublish}
        onRemove={handleRemove}
        onEnterScore={setEnterScoreGame}
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

      {enterScoreGame && (
        <EnterScoreModal
          game={enterScoreGame}
          onClose={() => setEnterScoreGame(null)}
          onSave={handleEnterScore}
        />
      )}
    </Page>
  );
};

export default Dashboard;

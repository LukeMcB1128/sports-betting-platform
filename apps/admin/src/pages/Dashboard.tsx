import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Game, GameStatus, GameOdds, BetLimits, LockedSides, Special, Event } from '../types';
import { colors } from '../styles/GlobalStyles';
import GamesTable from '../components/GamesTable';
import BetsPanel from '../components/BetsPanel';
import UsersPanel from '../components/UsersPanel';
import EventsPanel from '../components/EventsPanel';
import FinancialsPanel from '../components/FinancialsPanel';
import AddGameModal from '../components/AddGameModal';
import AdvancedGameModal from '../components/AdvancedGameModal';
import EnterScoreModal from '../components/EnterScoreModal';
import SettingsModal from '../components/SettingsModal';
import Button from '../components/Button';
import { fetchEvents } from '../api/eventsApi';
import {
  fetchGames,
  createGame,
  updateGameStatus,
  updateGameOdds,
  togglePublishGame,
  updateGameScore,
  updateBettingEnabled,
  removeGame,
  saveBetLimits,
  updateLockedSides,
  updateSpecials,
  voidAllBets,
} from '../api/gamesApi';

type ActiveTab = 'games' | 'bets' | 'users' | 'events' | 'financials';

const Page = styled.main`
  max-width: 1100px;
  margin: 0 auto;
  padding: 28px 20px;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.text};
`;

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TabBar = styled.div`
  display: flex;
  gap: 2px;
  border-bottom: 1px solid ${colors.border};
  margin-bottom: 24px;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ active }) => (active ? colors.accent : colors.textMuted)};
  border-bottom: 2px solid ${({ active }) => (active ? colors.accent : 'transparent')};
  margin-bottom: -1px;
  border-radius: 0;
  transition: color 0.15s, border-color 0.15s;
  background: none;

  &:hover {
    color: ${({ active }) => (active ? colors.accent : colors.text)};
  }
`;

// ─── Stats / banners (games tab) ──────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

interface DashboardProps {
  adminToken: string;
}

const Dashboard: React.FC<DashboardProps> = ({ adminToken }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('games');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [showAddGame, setShowAddGame] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [advancedGame, setAdvancedGame] = useState<Game | null>(null);
  const [enterScoreGame, setEnterScoreGame] = useState<Game | null>(null);

  useEffect(() => {
    fetchGames()
      .then(setGames)
      .catch(() => setError('Cannot connect to dev server. Run: node infra/dev-server.js'))
      .finally(() => setLoading(false));
    fetchEvents(adminToken).then(setEvents).catch(() => {});
  }, [adminToken]);

  const handleAddGame = async (game: Game) => {
    const created = await createGame(game);
    setGames((prev) => [created, ...prev]);
  };

  const handleUpdateStatus = async (gameId: string, status: GameStatus) => {
    const updated = await updateGameStatus(gameId, status);
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? updated : g))
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

  const handleEnableDisableBetting = async (game: Game) => {
    const bettingEnabled = !game.bettingEnabled;
    await updateBettingEnabled(game.id, bettingEnabled);
    setGames((prev) =>
      prev.map((g) => (g.id === game.id ? { ...g, bettingEnabled } : g))
    );
  };

  const handleSaveBetLimits = async (gameId: string, betLimits: BetLimits) => {
    const updated = await saveBetLimits(gameId, betLimits);
    setGames((prev) => prev.map((g) => (g.id === gameId ? updated : g)));
  };

  const handleUpdateLockedSides = async (gameId: string, lockedSides: LockedSides) => {
    const updated = await updateLockedSides(gameId, lockedSides);
    setGames((prev) => prev.map((g) => (g.id === gameId ? updated : g)));
  };

  const handleUpdateSpecials = async (gameId: string, specials: Special[]) => {
    const updated = await updateSpecials(gameId, specials);
    setGames((prev) => prev.map((g) => (g.id === gameId ? updated : g)));
  };

  const handleVoidAllBets = async (gameId: string) => {
    await voidAllBets(gameId, adminToken);
    // bets panel will refresh on its own poll; no game state change needed
  };

  const filteredGames = eventFilter === 'all'
    ? games
    : eventFilter === 'none'
      ? games.filter((g) => !g.eventId)
      : games.filter((g) => g.eventId === eventFilter);

  const upcomingCount  = games.filter((g) => g.status === 'upcoming').length;
  const liveCount      = games.filter((g) => g.status === 'live').length;
  const resolvingCount = games.filter((g) => g.status === 'resolving').length;
  const finalCount     = games.filter((g) => g.status === 'final').length;

  return (
    <Page>
      <PageHeader>
        <PageTitle>
          {activeTab === 'games' ? 'Games' : activeTab === 'bets' ? 'Bets' : activeTab === 'users' ? 'Users' : activeTab === 'events' ? 'Events' : 'Financials'}
        </PageTitle>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {activeTab === 'games' && (
            <Button variant="primary" onClick={() => setShowAddGame(true)} disabled={!!error}>
              + Add Game
            </Button>
          )}
          <Button variant="ghost" onClick={() => setShowSettings(true)} title="Settings">
            ⚙
          </Button>
        </div>
      </PageHeader>

      {/* Tab bar */}
      <TabBar>
        <Tab active={activeTab === 'games'} onClick={() => setActiveTab('games')}>
          Games
        </Tab>
        <Tab active={activeTab === 'bets'} onClick={() => setActiveTab('bets')}>
          Bets
        </Tab>
        <Tab active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
          Users
        </Tab>
        <Tab active={activeTab === 'events'} onClick={() => setActiveTab('events')}>
          Events
        </Tab>
        <Tab active={activeTab === 'financials'} onClick={() => setActiveTab('financials')}>
          Financials
        </Tab>
      </TabBar>

      {/* ── Games tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'games' && (
        <>
          {loading && <Banner variant="loading">Loading games from dev server…</Banner>}
          {error && <Banner variant="error">{error}</Banner>}

          {!loading && !error && (
            <>
              {/* Event filter */}
              {events.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Event</span>
                  <select
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${colors.border}`, backgroundColor: colors.surface, color: colors.text, fontSize: 13, cursor: 'pointer' }}
                  >
                    <option value="all">All events</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>{ev.name}{ev.isActive ? ' ★' : ''}</option>
                    ))}
                    <option value="none">No event (legacy)</option>
                  </select>
                </div>
              )}

              <StatsRow>
                <StatCard>
                  <StatValue>{filteredGames.length}</StatValue>
                  <StatLabel>Total</StatLabel>
                </StatCard>
                <StatCard>
                  <StatValue>{filteredGames.filter((g) => g.status === 'upcoming').length}</StatValue>
                  <StatLabel>Upcoming</StatLabel>
                </StatCard>
                <StatCard>
                  <StatValue style={{ color: colors.live }}>{filteredGames.filter((g) => g.status === 'live').length}</StatValue>
                  <StatLabel>Live</StatLabel>
                </StatCard>
                <StatCard>
                  <StatValue>{filteredGames.filter((g) => g.status === 'resolving').length}</StatValue>
                  <StatLabel>Resolving</StatLabel>
                </StatCard>
                <StatCard>
                  <StatValue style={{ color: colors.textMuted }}>{filteredGames.filter((g) => g.status === 'final').length}</StatValue>
                  <StatLabel>Final</StatLabel>
                </StatCard>
              </StatsRow>
            </>
          )}

          <GamesTable
            games={filteredGames}
            onUpdateStatus={handleUpdateStatus}
            onUpdateOdds={handleSaveLines}
            onTogglePublish={handleTogglePublish}
            onEnterScore={setEnterScoreGame}
            onEnableDisableBetting={handleEnableDisableBetting}
            onAdvanced={(game) => setAdvancedGame(game)}
          />
        </>
      )}

      {/* ── Bets tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'bets' && <BetsPanel adminToken={adminToken} events={events} />}

      {/* ── Users tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'users' && <UsersPanel adminToken={adminToken} />}

      {/* ── Events tab ────────────────────────────────────────────────────── */}
      {activeTab === 'events' && (
        <EventsPanel
          adminToken={adminToken}
          games={games}
        />
      )}

      {/* ── Financials tab ────────────────────────────────────────────────── */}
      {activeTab === 'financials' && <FinancialsPanel adminToken={adminToken} events={events} />}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {showAddGame && (
        <AddGameModal
          onClose={() => setShowAddGame(false)}
          onAdd={handleAddGame}
        />
      )}

      {showSettings && (
        <SettingsModal
          adminToken={adminToken}
          onClose={() => setShowSettings(false)}
        />
      )}

      {advancedGame && (
        <AdvancedGameModal
          game={advancedGame}
          adminToken={adminToken}
          onClose={() => setAdvancedGame(null)}
          onSaveLines={handleSaveLines}
          onSaveBetLimits={handleSaveBetLimits}
          onUpdateLockedSides={handleUpdateLockedSides}
          onUpdateSpecials={handleUpdateSpecials}
          onVoidAllBets={handleVoidAllBets}
          onRemove={(gameId) => {
            handleRemove(gameId);
            setAdvancedGame(null);
          }}
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

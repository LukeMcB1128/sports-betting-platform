import React from 'react';
import styled from 'styled-components';
import { Game } from '../types';
import { colors } from '../styles/GlobalStyles';
import GameCard from '../components/GameCard';
import useGames from '../hooks/useGames';

// Fallback shown only if the admin app has never been opened in this browser
const FALLBACK_GAMES: Game[] = [];

type GroupedGames = { label: string; games: Game[] }[];

const groupGames = (games: Game[]): GroupedGames => {
  const visible = games.filter((g) => g.published);
  const live = visible.filter((g) => g.status === 'live' || g.status === 'resolving');
  const finished = visible.filter((g) => g.status === 'final');
  const byLeague: Record<string, Game[]> = {};
  visible
    .filter((g) => g.status !== 'live' && g.status !== 'resolving' && g.status !== 'final')
    .forEach((g) => {
      const key = `${g.sport} - ${g.league}`;
      if (!byLeague[key]) byLeague[key] = [];
      byLeague[key].push(g);
    });

  const groups: GroupedGames = [];
  if (live.length) groups.push({ label: 'Live Now', games: live });
  Object.entries(byLeague).forEach(([league, gs]) => {
    groups.push({ label: league, games: gs });
  });
  // old way of filtering, changing to a new way that shows sport as well
  //if (finished.length) groups.push({ label: 'Finished', games: finished });
  const byFinished: Record<string, Game[]>={};
  finished.forEach((g)=> {
    const key = `${g.sport} - ${g.league}`;
    if (!byFinished[key]) byFinished[key] = [];
    byFinished[key].push(g);
  });
  Object.entries(byFinished).forEach(([key, gs]) => {
    groups.push({ label: `Finished - ${key}`, games: gs });
  });
  return groups;
};

const Page = styled.main`
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px;
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.text};
  margin-bottom: 24px;
`;

const Section = styled.section`
  margin-bottom: 32px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const SectionTitle = styled.h2`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.8px;
`;

const LiveDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${colors.live};
  flex-shrink: 0;
`;

const GameGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 12px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 64px 16px;
  color: ${colors.textMuted};
  font-size: 14px;
`;

const EmptyTitle = styled.p`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: 8px;
`;

interface HomeProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

const Home: React.FC<HomeProps> = ({ balance, onBalanceChange }) => {
  const games = useGames(FALLBACK_GAMES);
  const groups = groupGames(games);

  return (
    <Page>
      <PageTitle>Games</PageTitle>

      {groups.length === 0 ? (
        <EmptyState>
          <EmptyTitle>No games available</EmptyTitle>
          <p>Check back soon.</p>
        </EmptyState>
      ) : (
        groups.map(({ label, games: groupGames }) => (
          <Section key={label}>
            <SectionHeader>
              {label === 'Live Now' && <LiveDot />}
              <SectionTitle>
                {label === 'Live Now' || label.startsWith('Finished')
                  ? label
                  : `Upcoming - ${label}`}
              </SectionTitle>
            </SectionHeader>
            <GameGrid>
              {groupGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  balance={balance}
                  onBalanceChange={onBalanceChange}
                />
              ))}
            </GameGrid>
          </Section>
        ))
      )}
    </Page>
  );
};

export default Home;

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
  // Only show published, non-final games to bettors
  const visible = games.filter((g) => g.published && g.status !== 'final');
  const live = visible.filter((g) => g.status === 'live' || g.status === 'resolving');
  const byLeague: Record<string, Game[]> = {};
  visible
    .filter((g) => g.status !== 'live' && g.status !== 'resolving')
    .forEach((g) => {
      if (!byLeague[g.league]) byLeague[g.league] = [];
      byLeague[g.league].push(g);
    });

  const groups: GroupedGames = [];
  if (live.length) groups.push({ label: 'Live Now', games: live });
  Object.entries(byLeague).forEach(([league, gs]) => {
    groups.push({ label: league, games: gs });
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

const Home: React.FC = () => {
  const games = useGames(FALLBACK_GAMES);
  const groups = groupGames(games);

  return (
    <Page>
      <PageTitle>Today's Games</PageTitle>

      {groups.length === 0 ? (
        <EmptyState>
          <EmptyTitle>No games available</EmptyTitle>
          <p>Check back soon or add games from the Admin panel.</p>
        </EmptyState>
      ) : (
        groups.map(({ label, games: groupGames }) => (
          <Section key={label}>
            <SectionHeader>
              {label === 'Live Now' && <LiveDot />}
              <SectionTitle>{label}</SectionTitle>
            </SectionHeader>
            <GameGrid>
              {groupGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </GameGrid>
          </Section>
        ))
      )}
    </Page>
  );
};

export default Home;

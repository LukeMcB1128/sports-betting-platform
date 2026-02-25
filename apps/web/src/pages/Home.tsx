import React from 'react';
import styled from 'styled-components';
import { Game } from '../types';
import { colors } from '../styles/GlobalStyles';
import GameCard from '../components/GameCard';

const MOCK_GAMES: Game[] = [
  {id: '1',
    sport: 'Basketball',
    league: '6A Basketball',
    awayTeam: 'Akins',
    homeTeam: 'Austin',
    startTime: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
    status: 'upcoming',
    odds: {
      moneyline: { away: -110, home: -110},
      spread: {
        away: { line: +4.5, juice: -110 },
        home: { line: -4.5, juice: -110 },
      },
    },
  },
  {id: '2',
    sport: 'Basketball',
    league: '6A Basketball',
    awayTeam: 'Lake Travis',
    homeTeam: 'Westlake',
    startTime: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
    status: 'upcoming',
    odds: {
      moneyline: { away: -110, home: -110},
      spread: {
        away: { line: +4.5, juice: -110 },
        home: { line: -4.5, juice: -110 },
      },
    },
  },
  {id: '3',
    sport: 'Basketball',
    league: '5A Basketball',
    awayTeam: 'McCallum',
    homeTeam: 'Anderson',
    startTime: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
    status: 'upcoming',
    odds: {
      moneyline: { away: -110, home: -110},
      spread: {
        away: { line: +4.5, juice: -110 },
        home: { line: -4.5, juice: -110 },
      },
    },
  }
];

const SPORT_ORDER = ['live', 'Basketball', 'Football', 'Soccer', 'Baseball'];

type GroupedGames = { label: string; games: Game[] }[];

const groupGames = (games: Game[]): GroupedGames => {
  const live = games.filter((g) => g.status === 'live');
  const byLeague: Record<string, Game[]> = {};
  games
    .filter((g) => g.status !== 'live')
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

const Home: React.FC = () => {
  const groups = groupGames(MOCK_GAMES);

  return (
    <Page>
      <PageTitle>Today's Games</PageTitle>
      {groups.map(({ label, games }) => (
        <Section key={label}>
          <SectionHeader>
            {label === 'Live Now' && <LiveDot />}
            <SectionTitle>{label}</SectionTitle>
          </SectionHeader>
          <GameGrid>
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </GameGrid>
        </Section>
      ))}
    </Page>
  );
};

export default Home;

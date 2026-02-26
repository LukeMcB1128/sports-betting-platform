import React from 'react';
import styled from 'styled-components';
import { Game } from '../types';
import { colors } from '../styles/GlobalStyles';
import OddsButton from './OddsButton';

interface GameCardProps {
  game: Game;
}

const Card = styled.div`
  background-color: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: 10px;
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid ${colors.border};
`;

const GameMeta = styled.span`
  font-size: 11px;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const LiveBadge = styled.span`
  background-color: ${colors.live};
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.5px;
`;

const ResolvingBadge = styled.span`
  background-color: #f59e0b;
  color: #000;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.5px;
`;

const CardBody = styled.div`
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TeamRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TeamName = styled.span<{ winner?: boolean }>`
  font-size: 15px;
  font-weight: 600;
  color: ${({ winner }) => winner ? colors.text : colors.textMuted};
`;

const Score = styled.span<{ winner?: boolean }>`
  font-size: 15px;
  font-weight: 700;
  color: ${({ winner }) => winner ? colors.text : colors.textMuted};
  min-width: 20px;
  text-align: right;
`;

const Divider = styled.div`
  height: 1px;
  background-color: ${colors.border};
`;

const MarketsRow = styled.div`
  display: flex;
  gap: 8px;
`;

const MarketGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MarketLabel = styled.span`
  font-size: 10px;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
`;

const OddsRow = styled.div`
  display: flex;
  gap: 4px;
`;

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const formatSpreadLabel = (team: string, line: number): string => {
  const sign = line > 0 ? '+' : '';
  return `${team} ${sign}${line}`;
};

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const isLive = game.status === 'live';
  const isResolving = game.status === 'resolving';
  const isFinal = game.status === 'final';
  const showScore = isLive || isResolving || isFinal;

  const awayScore = game.awayScore ?? 0;
  const homeScore = game.homeScore ?? 0;
  const awayWon = isFinal && awayScore > homeScore;
  const homeWon = isFinal && homeScore > awayScore;

  const metaTime = isLive || isResolving ? 'In Progress' : isFinal ? 'Final' : formatTime(game.startTime);

  return (
    <Card>
      <CardHeader>
        <GameMeta>{game.league} · {metaTime}</GameMeta>
        {isLive && <LiveBadge>LIVE</LiveBadge>}
        {isResolving && <ResolvingBadge>RESOLVING</ResolvingBadge>}
      </CardHeader>

      <CardBody>
        <TeamRow>
          <TeamName winner={!isFinal || awayWon}>{game.awayTeam}</TeamName>
          {showScore && <Score winner={!isFinal || awayWon}>{awayScore}</Score>}
        </TeamRow>
        <TeamRow>
          <TeamName winner={!isFinal || homeWon}>{game.homeTeam}</TeamName>
          {showScore && <Score winner={!isFinal || homeWon}>{homeScore}</Score>}
        </TeamRow>

        {!isFinal && !isResolving && (
          <>
            <Divider />
            <MarketsRow>
              <MarketGroup>
                <MarketLabel>Moneyline</MarketLabel>
                <OddsRow>
                  <OddsButton label={game.awayTeam} odds={game.odds.moneyline.away} />
                  <OddsButton label={game.homeTeam} odds={game.odds.moneyline.home} />
                </OddsRow>
              </MarketGroup>

              <MarketGroup>
                <MarketLabel>Spread</MarketLabel>
                <OddsRow>
                  <OddsButton
                    label={formatSpreadLabel(game.awayTeam, game.odds.spread.away.line)}
                    odds={game.odds.spread.away.juice}
                  />
                  <OddsButton
                    label={formatSpreadLabel(game.homeTeam, game.odds.spread.home.line)}
                    odds={game.odds.spread.home.juice}
                  />
                </OddsRow>
              </MarketGroup>
            </MarketsRow>
          </>
        )}

        {isResolving && (
          <>
            <Divider />
            <GameMeta style={{ fontSize: 11, color: '#f59e0b' }}>Betting closed — awaiting final score</GameMeta>
          </>
        )}
      </CardBody>
    </Card>
  );
};

export default GameCard;

import React, { useState } from 'react';
import styled from 'styled-components';
import { Game, BetType, BetSide } from '../types';
import { colors } from '../styles/GlobalStyles';
import OddsButton from './OddsButton';
import BetSlipPanel from './BetSlipPanel';

interface GameCardProps {
  game: Game;
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

interface SelectedBet {
  betType: BetType;
  side: BetSide;
  label: string;
  odds: number;
  line?: number; // spread line, only for spread bets
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

const BettingSuspendedBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: ${colors.textMuted};
  background-color: ${colors.surfaceHover};
  border: 1px solid ${colors.border};
  border-radius: 6px;
  padding: 7px 10px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
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

const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  const date = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time}`;
};

const formatSpreadLabel = (team: string, line: number): string => {
  const sign = line > 0 ? '+' : '';
  return `${team} ${sign}${line}`;
};

const isSameBet = (a: SelectedBet | null, betType: BetType, side: BetSide) =>
  a !== null && a.betType === betType && a.side === side;

const GameCard: React.FC<GameCardProps> = ({ game, balance, onBalanceChange }) => {
  const [selected, setSelected] = useState<SelectedBet | null>(null);

  const isLive = game.status === 'live';
  const isResolving = game.status === 'resolving';
  const isFinal = game.status === 'final';
  const bettingOpen = game.bettingEnabled !== false; // undefined → open (backward compat)
  const showScore = isLive || isResolving || isFinal;

  const awayScore = game.awayScore ?? 0;
  const homeScore = game.homeScore ?? 0;
  const awayWon = isFinal && awayScore > homeScore;
  const homeWon = isFinal && homeScore > awayScore;

  const gameDate = new Date(game.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' });
  const metaTime = isLive || isResolving ? 'In Progress' : isFinal ? `${gameDate} · Final` : formatDateTime(game.startTime);

  const handleSelect = (betType: BetType, side: BetSide, label: string, odds: number, line?: number) => {
    if (!bettingOpen) return;
    // Toggle off if same button clicked again
    if (isSameBet(selected, betType, side)) {
      setSelected(null);
    } else {
      setSelected({ betType, side, label, odds, line });
    }
  };

  // Clear any open bet slip if betting gets suspended while it's open
  React.useEffect(() => {
    if (!bettingOpen && selected) setSelected(null);
  }, [bettingOpen, selected]);

  const handleBetSuccess = (newBalance: number) => {
    setSelected(null);
    onBalanceChange(newBalance);
  };

  return (
    <Card>
      <CardHeader>
        <GameMeta>{game.sport} · {game.league} · {metaTime}</GameMeta>
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

            {!bettingOpen ? (
              <BettingSuspendedBanner>
                  Betting closed
              </BettingSuspendedBanner>
            ) : (
              <>
                <MarketsRow>
                  <MarketGroup>
                    <MarketLabel>Moneyline</MarketLabel>
                    <OddsRow>
                      <OddsButton
                        label={game.awayTeam}
                        odds={game.odds.moneyline.away}
                        selected={isSameBet(selected, 'moneyline', 'away')}
                        onSelect={() => handleSelect('moneyline', 'away', game.awayTeam, game.odds.moneyline.away)}
                      />
                      <OddsButton
                        label={game.homeTeam}
                        odds={game.odds.moneyline.home}
                        selected={isSameBet(selected, 'moneyline', 'home')}
                        onSelect={() => handleSelect('moneyline', 'home', game.homeTeam, game.odds.moneyline.home)}
                      />
                    </OddsRow>
                  </MarketGroup>

                  <MarketGroup>
                    <MarketLabel>Spread</MarketLabel>
                    <OddsRow>
                      <OddsButton
                        label={formatSpreadLabel(game.awayTeam, game.odds.spread.away.line)}
                        odds={game.odds.spread.away.juice}
                        selected={isSameBet(selected, 'spread', 'away')}
                        onSelect={() => handleSelect(
                          'spread', 'away',
                          formatSpreadLabel(game.awayTeam, game.odds.spread.away.line),
                          game.odds.spread.away.juice,
                          game.odds.spread.away.line,
                        )}
                      />
                      <OddsButton
                        label={formatSpreadLabel(game.homeTeam, game.odds.spread.home.line)}
                        odds={game.odds.spread.home.juice}
                        selected={isSameBet(selected, 'spread', 'home')}
                        onSelect={() => handleSelect(
                          'spread', 'home',
                          formatSpreadLabel(game.homeTeam, game.odds.spread.home.line),
                          game.odds.spread.home.juice,
                          game.odds.spread.home.line,
                        )}
                      />
                    </OddsRow>
                  </MarketGroup>
                </MarketsRow>

                {selected && (
                  <BetSlipPanel
                    gameId={game.id}
                    betType={selected.betType}
                    side={selected.side}
                    label={selected.label}
                    odds={selected.odds}
                    line={selected.line}
                    balance={balance}
                    onClose={() => setSelected(null)}
                    onSuccess={handleBetSuccess}
                  />
                )}
              </>
            )}
          </>
        )}

        {isResolving && (
          <>
            <Divider />
            <GameMeta style={{ fontSize: 11, color: '#f59e0b' }}>Awaiting final score</GameMeta>
          </>
        )}
      </CardBody>
    </Card>
  );
};

export default GameCard;

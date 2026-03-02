import React from 'react';
import styled, { css } from 'styled-components';
import { Bet, BetStatus, Game } from '../types';
import { colors } from '../styles/GlobalStyles';
import useBets from '../hooks/useBets';
import useGames from '../hooks/useGames';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatOdds = (n: number) => (n > 0 ? `+${n}` : `${n}`);

const formatMoney = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const calcProfit = (bet: Bet) => parseFloat((bet.payout - bet.stake).toFixed(2));

// ─── Status colours ──────────────────────────────────────────────────────────

const STATUS_COLOR: Record<BetStatus, string> = {
  pending: '#f59e0b',
  won:     colors.positive,
  lost:    colors.negative,
  void:    colors.textMuted,
};

const STATUS_BG: Record<BetStatus, string> = {
  pending: 'rgba(245,158,11,0.12)',
  won:     'rgba(34,197,94,0.12)',
  lost:    'rgba(239,68,68,0.12)',
  void:    'rgba(123,129,153,0.12)',
};

const CARD_ACCENT: Record<BetStatus, string> = {
  pending: 'transparent',
  won:     colors.positive,
  lost:    colors.negative,
  void:    colors.textMuted,
};

// ─── Status badge ────────────────────────────────────────────────────────────

const StatusBadge = styled.span<{ status: BetStatus }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${({ status }) => STATUS_COLOR[status]};
  background-color: ${({ status }) => STATUS_BG[status]};
  border: 1px solid ${({ status }) => STATUS_COLOR[status]}40;
  flex-shrink: 0;
`;

// ─── Layout ──────────────────────────────────────────────────────────────────

const Page = styled.main`
  max-width: 860px;
  margin: 0 auto;
  padding: 24px 16px;
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.text};
  margin-bottom: 24px;
`;

// ─── Stats row ───────────────────────────────────────────────────────────────

const StatsRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 28px;
  flex-wrap: wrap;
`;

const StatCard = styled.div`
  background-color: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: 8px;
  padding: 14px 20px;
  min-width: 120px;
`;

const StatValue = styled.div<{ color?: string }>`
  font-size: 22px;
  font-weight: 700;
  color: ${({ color }) => color ?? colors.text};
  line-height: 1;
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 5px;
`;

// ─── Bet cards ───────────────────────────────────────────────────────────────

const BetList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const BetCard = styled.div<{ status: BetStatus }>`
  background-color: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-left: 3px solid ${({ status }) => CARD_ACCENT[status]};
  transition: border-color 0.2s;

  ${({ status }) =>
    status !== 'pending' &&
    css`
      background-color: ${STATUS_BG[status]};
    `}
`;

const BetCardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const BetLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const BetName = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: ${colors.text};
`;

const MarketTag = styled.span`
  font-size: 10px;
  font-weight: 500;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background-color: ${colors.surfaceHover};
  border: 1px solid ${colors.border};
  border-radius: 4px;
  padding: 1px 6px;
`;

const OddsPill = styled.span<{ positive: boolean }>`
  font-size: 13px;
  font-weight: 700;
  color: ${({ positive }) => (positive ? colors.positive : colors.text)};
`;

const BetCardMid = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const GameInfo = styled.span`
  font-size: 12px;
  color: ${colors.textMuted};
`;

const ScoreSpan = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${colors.text};
`;

const Dot = styled.span`
  font-size: 12px;
  color: ${colors.border};
`;

const BetCardBottom = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px solid ${colors.border};
`;

const AmountGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const AmountLabel = styled.span`
  font-size: 10px;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const AmountValue = styled.span<{ highlight?: 'won' | 'lost' | 'void' }>`
  font-size: 15px;
  font-weight: 600;
  color: ${({ highlight }) =>
    highlight === 'won'  ? colors.positive :
    highlight === 'lost' ? colors.negative :
    highlight === 'void' ? colors.textMuted :
    colors.text};
`;

const PlacedAt = styled.span`
  font-size: 11px;
  color: ${colors.textMuted};
  margin-left: auto;
`;

// ─── Empty ───────────────────────────────────────────────────────────────────

const EmptyState = styled.div`
  text-align: center;
  padding: 64px 16px;
  color: ${colors.textMuted};
`;

const EmptyTitle = styled.p`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: 8px;
`;

// ─── Helpers for resolved card amounts ───────────────────────────────────────

interface AmountRowProps {
  bet: Bet;
}

const AmountRow: React.FC<AmountRowProps> = ({ bet }) => {
  const profit = calcProfit(bet);

  if (bet.status === 'won') {
    return (
      <>
        <AmountGroup>
          <AmountLabel>Stake</AmountLabel>
          <AmountValue>${formatMoney(bet.stake)}</AmountValue>
        </AmountGroup>
        <AmountGroup>
          <AmountLabel>Profit</AmountLabel>
          <AmountValue highlight="won">+${formatMoney(profit)}</AmountValue>
        </AmountGroup>
        <AmountGroup>
          <AmountLabel>Payout</AmountLabel>
          <AmountValue highlight="won">${formatMoney(bet.payout)}</AmountValue>
        </AmountGroup>
      </>
    );
  }

  if (bet.status === 'lost') {
    return (
      <>
        <AmountGroup>
          <AmountLabel>Stake Lost</AmountLabel>
          <AmountValue highlight="lost">-${formatMoney(bet.stake)}</AmountValue>
        </AmountGroup>
        <AmountGroup>
          <AmountLabel>To Win</AmountLabel>
          <AmountValue highlight="lost">${formatMoney(profit)}</AmountValue>
        </AmountGroup>
      </>
    );
  }

  if (bet.status === 'void') {
    return (
      <>
        <AmountGroup>
          <AmountLabel>Stake Refunded</AmountLabel>
          <AmountValue highlight="void">${formatMoney(bet.stake)}</AmountValue>
        </AmountGroup>
      </>
    );
  }

  // pending
  return (
    <>
      <AmountGroup>
        <AmountLabel>Stake</AmountLabel>
        <AmountValue>${formatMoney(bet.stake)}</AmountValue>
      </AmountGroup>
      <AmountGroup>
        <AmountLabel>To Win</AmountLabel>
        <AmountValue>${formatMoney(profit)}</AmountValue>
      </AmountGroup>
      <AmountGroup>
        <AmountLabel>Payout</AmountLabel>
        <AmountValue>${formatMoney(bet.payout)}</AmountValue>
      </AmountGroup>
    </>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

const MyBets: React.FC = () => {
  const bets  = useBets();
  const games = useGames([]);

  const gameMap = React.useMemo(
    () => Object.fromEntries(games.map((g) => [g.id, g])),
    [games],
  );

  // Stats
  const totalStaked  = bets.reduce((s, b) => s + b.stake, 0);
  const pendingBets  = bets.filter((b) => b.status === 'pending');
  const wonBets      = bets.filter((b) => b.status === 'won');
  const lostBets     = bets.filter((b) => b.status === 'lost');
  const totalWon     = wonBets.reduce((s, b) => s + b.payout, 0);
  const totalLost    = lostBets.reduce((s, b) => s + b.stake, 0);
  const netPL        = parseFloat((totalWon - totalLost).toFixed(2));
  const netPLColor   = netPL > 0 ? colors.positive : netPL < 0 ? colors.negative : colors.text;

  // Show settled bets (won/lost/void) first, then pending — so resolved ones are prominent
  const sortedBets = [...bets].sort((a, b) => {
    const order: Record<BetStatus, number> = { won: 0, lost: 1, void: 2, pending: 3 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    // Within same status, most recent first
    return new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();
  });

  return (
    <Page>
      <PageTitle>My Bets</PageTitle>

      {bets.length > 0 && (
        <StatsRow>
          <StatCard>
            <StatValue>{bets.length}</StatValue>
            <StatLabel>Total Bets</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>${formatMoney(totalStaked)}</StatValue>
            <StatLabel>Total Staked</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue color="#f59e0b">{pendingBets.length}</StatValue>
            <StatLabel>Pending</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue color="#FF0000">{lostBets.length}</StatValue>
            <StatLabel>Lost</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue color="#00ff00">{wonBets.length}</StatValue>
            <StatLabel>Won</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue color={netPLColor}>
              {`${netPL >= 0 ? '+' : '-'}$${formatMoney(Math.abs(netPL))}`}
            </StatValue>
            <StatLabel>Net P&amp;L</StatLabel>
          </StatCard>
        </StatsRow>
      )}

      {bets.length === 0 ? (
        <EmptyState>
          <EmptyTitle>No bets yet</EmptyTitle>
          <p>Head to <a href="/" style={{ color: colors.accent }}>Games</a> to place your first bet.</p>
        </EmptyState>
      ) : (
        <BetList>
          {sortedBets.map((bet) => {
            const game = gameMap[bet.gameId] as Game | undefined;
            const isFinal = game?.status === 'final' || game?.status === 'resolving';

            return (
              <BetCard key={bet.id} status={bet.status}>
                {/* Top row: label + status */}
                <BetCardTop>
                  <BetLabel>
                    <StatusBadge status={bet.status}>{bet.status}</StatusBadge>
                    <MarketTag>{bet.betType}</MarketTag>
                    <BetName>{bet.label}</BetName>
                    <OddsPill positive={bet.odds > 0}>{formatOdds(bet.odds)}</OddsPill>
                  </BetLabel>
                </BetCardTop>

                {/* Game info + final score if available */}
                {game && (
                  <BetCardMid>
                    {isFinal && game.awayScore !== undefined ? (
                      <>
                        <ScoreSpan>{game.awayTeam} {game.awayScore}</ScoreSpan>
                        <Dot>@</Dot>
                        <ScoreSpan>{game.homeTeam} {game.homeScore}</ScoreSpan>
                      </>
                    ) : (
                      <GameInfo>{game.awayTeam} @ {game.homeTeam}</GameInfo>
                    )}
                    <Dot>·</Dot>
                    <GameInfo>{game.league}</GameInfo>
                    {isFinal && <GameInfo>· Final</GameInfo>}
                  </BetCardMid>
                )}

                {/* Amounts */}
                <BetCardBottom>
                  <AmountRow bet={bet} />
                  <PlacedAt>Placed {formatDate(bet.placedAt)}</PlacedAt>
                </BetCardBottom>
              </BetCard>
            );
          })}
        </BetList>
      )}
    </Page>
  );
};

export default MyBets;

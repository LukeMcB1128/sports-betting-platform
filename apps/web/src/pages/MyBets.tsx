import React from 'react';
import styled, { css } from 'styled-components';
import { Bet, BetStatus, Game, Parlay } from '../types';
import { colors } from '../styles/GlobalStyles';
import useBets from '../hooks/useBets';
import useGames from '../hooks/useGames';
import useParlays from '../hooks/useParlays';

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

// ─── Unified item type ───────────────────────────────────────────────────────

type UnifiedItem =
  | { kind: 'bet'; data: Bet; placedAt: string }
  | { kind: 'parlay'; data: Parlay; placedAt: string };

const byDate = (a: UnifiedItem, b: UnifiedItem) =>
  new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();

// ─── Status colours ──────────────────────────────────────────────────────────

const STATUS_COLOR: Record<BetStatus, string> = {
  awaiting_payment: '#3b82f6',
  pending: '#f59e0b',
  won:     colors.positive,
  lost:    colors.negative,
  void:    colors.textMuted,
};

const STATUS_BG: Record<BetStatus, string> = {
  awaiting_payment: 'rgba(59,130,246,0.12)',
  pending: 'rgba(245,158,11,0.12)',
  won:     'rgba(34,197,94,0.12)',
  lost:    'rgba(239,68,68,0.12)',
  void:    'rgba(123,129,153,0.12)',
};

const CARD_ACCENT: Record<BetStatus, string> = {
  awaiting_payment: '#3b82f6',
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

// ─── Section header ───────────────────────────────────────────────────────────

const SectionHeading = styled.h2`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: ${colors.textMuted};
  margin-bottom: 10px;
  margin-top: 28px;
`;

const AwaitingBanner = styled.div`
  background-color: rgba(59,130,246,0.08);
  border: 1px solid rgba(59,130,246,0.3);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12px;
  color: #93c5fd;
  margin-bottom: 12px;
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

// ─── Parlay card ─────────────────────────────────────────────────────────────

const ParlayCard = styled.div<{ status: string }>`
  background-color: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-left: 3px solid ${({ status }) => STATUS_COLOR[status as BetStatus] ?? colors.border};

  ${({ status }) =>
    status !== 'pending' &&
    css`background-color: ${STATUS_BG[status as BetStatus] ?? 'transparent'};`}
`;

const ParlayTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const ParlayStatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${({ status }) => STATUS_COLOR[status as BetStatus] ?? colors.textMuted};
  background-color: ${({ status }) => STATUS_BG[status as BetStatus] ?? 'transparent'};
  border: 1px solid ${({ status }) => (STATUS_COLOR[status as BetStatus] ?? colors.textMuted) + '40'};
  flex-shrink: 0;
`;

const ParlayLegsWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ParlayLegRow = styled.div`
  font-size: 12px;
  color: ${colors.textMuted};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ParlayLegLabel = styled.span`
  color: ${colors.text};
  font-weight: 500;
`;

const ParlayLegOdds = styled.span<{ positive: boolean }>`
  font-size: 11px;
  font-weight: 700;
  color: ${({ positive }) => (positive ? colors.positive : colors.text)};
`;

const ParlayBottomRow = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px solid ${colors.border};
`;

const ParlayCardDisplay: React.FC<{ parlay: Parlay; gameMap: Record<string, Game> }> = ({ parlay, gameMap }) => {
  const combinedOddsStr = parlay.combinedOdds > 0 ? `+${parlay.combinedOdds}` : `${parlay.combinedOdds}`;
  const profit = parseFloat((parlay.payout - parlay.stake).toFixed(2));

  return (
    <ParlayCard status={parlay.status}>
      <ParlayTopRow>
        <ParlayStatusBadge status={parlay.status}>
          {parlay.status === 'awaiting_payment' ? 'Awaiting Payment' : parlay.status}
        </ParlayStatusBadge>
        <MarketTag>Parlay</MarketTag>
        <span style={{ fontSize: 12, color: colors.textMuted }}>{parlay.legs.length}-Leg</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: parlay.combinedOdds > 0 ? colors.positive : colors.text }}>
          {combinedOddsStr}
        </span>
      </ParlayTopRow>

      <ParlayLegsWrap>
        {parlay.legs.map((leg, i) => {
          const game = gameMap[leg.gameId];
          return (
            <ParlayLegRow key={i}>
              <span>•</span>
              <ParlayLegLabel>{leg.label}</ParlayLegLabel>
              <ParlayLegOdds positive={leg.odds > 0}>
                {leg.odds > 0 ? `+${leg.odds}` : leg.odds}
              </ParlayLegOdds>
              {game && (
                <span style={{ color: colors.textMuted }}>
                  ({game.awayTeam} @ {game.homeTeam})
                </span>
              )}
            </ParlayLegRow>
          );
        })}
      </ParlayLegsWrap>

      <ParlayBottomRow>
        <AmountGroup>
          <AmountLabel>Stake</AmountLabel>
          <AmountValue>${formatMoney(parlay.stake)}</AmountValue>
        </AmountGroup>
        <AmountGroup>
          <AmountLabel>To Win</AmountLabel>
          <AmountValue highlight={parlay.status === 'won' ? 'won' : parlay.status === 'lost' ? 'lost' : undefined}>
            {parlay.status === 'lost' ? '-' : '+'}${formatMoney(profit)}
          </AmountValue>
        </AmountGroup>
        <AmountGroup>
          <AmountLabel>Payout</AmountLabel>
          <AmountValue highlight={parlay.status === 'won' ? 'won' : undefined}>
            ${formatMoney(parlay.payout)}
          </AmountValue>
        </AmountGroup>
        <PlacedAt>Placed {formatDate(parlay.placedAt)}</PlacedAt>
      </ParlayBottomRow>
    </ParlayCard>
  );
};

// ─── Bet amount row ───────────────────────────────────────────────────────────

const AmountRow: React.FC<{ bet: Bet }> = ({ bet }) => {
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
      <AmountGroup>
        <AmountLabel>Stake Refunded</AmountLabel>
        <AmountValue highlight="void">${formatMoney(bet.stake)}</AmountValue>
      </AmountGroup>
    );
  }

  if (bet.status === 'awaiting_payment') {
    return (
      <>
        <AmountGroup>
          <AmountLabel>Bet Amount</AmountLabel>
          <AmountValue>${formatMoney(bet.stake)}</AmountValue>
        </AmountGroup>
        <AmountGroup>
          <AmountLabel>To Win</AmountLabel>
          <AmountValue>${formatMoney(profit)}</AmountValue>
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

// ─── Bet card ─────────────────────────────────────────────────────────────────

const BetCardDisplay: React.FC<{ bet: Bet; gameMap: Record<string, Game> }> = ({ bet, gameMap }) => {
  const game = gameMap[bet.gameId] as Game | undefined;
  const isFinal = game?.status === 'final' || game?.status === 'resolving';

  return (
    <BetCard status={bet.status}>
      <BetCardTop>
        <BetLabel>
          <StatusBadge status={bet.status}>
            {bet.status === 'awaiting_payment' ? 'Awaiting Payment' : bet.status}
          </StatusBadge>
          <MarketTag>{bet.betType}</MarketTag>
          <BetName>{bet.label}</BetName>
          <OddsPill positive={bet.odds > 0}>{formatOdds(bet.odds)}</OddsPill>
        </BetLabel>
      </BetCardTop>

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

      <BetCardBottom>
        <AmountRow bet={bet} />
        <PlacedAt>Placed {formatDate(bet.placedAt)}</PlacedAt>
      </BetCardBottom>
    </BetCard>
  );
};

// ─── Page component ───────────────────────────────────────────────────────────

const MyBets: React.FC = () => {
  const storedUser = localStorage.getItem('authedUser');
  const authedUser = storedUser ? JSON.parse(storedUser) : null;
  const userId = authedUser?.id ?? '';
  const bets    = useBets(userId);
  const parlays = useParlays(userId);
  const games   = useGames([]);

  const gameMap = React.useMemo(
    () => Object.fromEntries(games.map((g) => [g.id, g])),
    [games],
  );

  // ── Stats — combined bets + parlays ──────────────────────────────────────────

  const awaitingBets    = bets.filter((b) => b.status === 'awaiting_payment');
  const awaitingParlays = parlays.filter((p) => p.status === 'awaiting_payment');
  const activeBets      = bets.filter((b) => b.status === 'pending');
  const activeParlays   = parlays.filter((p) => p.status === 'pending');
  const wonBets         = bets.filter((b) => b.status === 'won');
  const wonParlays      = parlays.filter((p) => p.status === 'won');
  const lostBets        = bets.filter((b) => b.status === 'lost');
  const lostParlays     = parlays.filter((p) => p.status === 'lost');
  const settledBets     = bets.filter((b) => ['won', 'lost', 'void'].includes(b.status));
  const settledParlays  = parlays.filter((p) => ['won', 'lost', 'void'].includes(p.status));

  const awaitingCount = awaitingBets.length + awaitingParlays.length;
  const activeCount   = activeBets.length + activeParlays.length;
  const wonCount      = wonBets.length + wonParlays.length;
  const lostCount     = lostBets.length + lostParlays.length;

  const totalWon  = wonBets.reduce((s, b) => s + b.payout, 0)
                  + wonParlays.reduce((s, p) => s + p.payout, 0);
  const totalLost = lostBets.reduce((s, b) => s + b.stake, 0)
                  + lostParlays.reduce((s, p) => s + p.stake, 0);
  const netPL      = parseFloat((totalWon - totalLost).toFixed(2));
  const netPLColor = netPL > 0 ? colors.positive : netPL < 0 ? colors.negative : colors.text;

  // ── Unified sections ──────────────────────────────────────────────────────────

  const awaitingItems: UnifiedItem[] = [
    ...awaitingBets.map((d) => ({ kind: 'bet' as const, data: d, placedAt: d.placedAt })),
    ...awaitingParlays.map((d) => ({ kind: 'parlay' as const, data: d, placedAt: d.placedAt })),
  ].sort(byDate);

  const activeItems: UnifiedItem[] = [
    ...activeBets.map((d) => ({ kind: 'bet' as const, data: d, placedAt: d.placedAt })),
    ...activeParlays.map((d) => ({ kind: 'parlay' as const, data: d, placedAt: d.placedAt })),
  ].sort(byDate);

  const settledItems: UnifiedItem[] = [
    ...settledBets.map((d) => ({ kind: 'bet' as const, data: d, placedAt: d.placedAt })),
    ...settledParlays.map((d) => ({ kind: 'parlay' as const, data: d, placedAt: d.placedAt })),
  ].sort(byDate);

  const hasAny = bets.length > 0 || parlays.length > 0;

  const renderItem = (item: UnifiedItem) =>
    item.kind === 'bet'
      ? <BetCardDisplay key={item.data.id} bet={item.data} gameMap={gameMap} />
      : <ParlayCardDisplay key={item.data.id} parlay={item.data} gameMap={gameMap} />;

  return (
    <Page>
      <PageTitle>My Bets</PageTitle>

      {hasAny && (
        <StatsRow>
          <StatCard>
            <StatValue color="#3b82f6">{awaitingCount}</StatValue>
            <StatLabel>Awaiting Payment</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue color="#f59e0b">{activeCount}</StatValue>
            <StatLabel>Active</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue color={colors.negative}>{lostCount}</StatValue>
            <StatLabel>Lost</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue color={colors.positive}>{wonCount}</StatValue>
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

      {!hasAny ? (
        <EmptyState>
          <EmptyTitle>No bets yet</EmptyTitle>
          <p>Head to <a href="/" style={{ color: colors.accent }}>Games</a> to place your first bet.</p>
        </EmptyState>
      ) : (
        <>
          {awaitingItems.length > 0 && (
            <>
              <SectionHeading>Awaiting Payment</SectionHeading>
              <AwaitingBanner>
                Give cash to Luke Puthoff or Venmo @Luke-Puthoff-1 to pay your bet.
              </AwaitingBanner>
              <BetList>{awaitingItems.map(renderItem)}</BetList>
            </>
          )}

          {activeItems.length > 0 && (
            <>
              <SectionHeading>Active Bets</SectionHeading>
              <BetList>{activeItems.map(renderItem)}</BetList>
            </>
          )}

          {settledItems.length > 0 && (
            <>
              <SectionHeading>Settled</SectionHeading>
              <BetList>{settledItems.map(renderItem)}</BetList>
            </>
          )}
        </>
      )}
    </Page>
  );
};

export default MyBets;

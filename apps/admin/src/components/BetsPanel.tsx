import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Bet, Game, BetStatus } from '../types';
import { colors } from '../styles/GlobalStyles';
import { fetchBets, deleteBet, confirmPayment } from '../api/betsApi';
import { fetchGames } from '../api/gamesApi';

const POLL_INTERVAL_MS = 5000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatOdds = (n: number) => (n > 0 ? `+${n}` : `${n}`);
const formatMoney = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<BetStatus, string> = {
  awaiting_payment: '#3b82f6',
  pending: '#f59e0b',
  won:     colors.success,
  lost:    colors.danger,
  void:    colors.textMuted,
};

const STATUS_BG: Record<BetStatus, string> = {
  awaiting_payment: 'rgba(59,130,246,0.12)',
  pending: 'rgba(245,158,11,0.12)',
  won:     'rgba(34,197,94,0.12)',
  lost:    'rgba(239,68,68,0.12)',
  void:    'rgba(123,129,153,0.12)',
};

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
  white-space: nowrap;
`;

// ─── Stats row ────────────────────────────────────────────────────────────────

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

// ─── Table ────────────────────────────────────────────────────────────────────

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid ${colors.border};
  border-radius: 10px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 780px;
`;

const Th = styled.th`
  text-align: left;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid ${colors.border};
  background-color: ${colors.surfaceHover};
  white-space: nowrap;

  &:first-child { border-radius: 10px 0 0 0; }
  &:last-child  { border-radius: 0 10px 0 0; }
`;

const Td = styled.td`
  padding: 12px 14px;
  border-bottom: 1px solid ${colors.border};
  vertical-align: middle;
  font-size: 13px;

  tr:last-child & { border-bottom: none; }
`;

const Tr = styled.tr<{ highlight?: boolean }>`
  ${({ highlight }) => highlight && `
    td { background-color: rgba(59,130,246,0.06); }
    td:first-child { border-left: 3px solid #3b82f6; }
  `}
  &:hover td { background-color: ${colors.surfaceHover}; }
`;

const Matchup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TeamLine = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${colors.text};
`;

const LeagueBadge = styled.span`
  background-color: ${colors.surfaceHover};
  border: 1px solid ${colors.border};
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 10px;
  color: ${colors.textMuted};
  white-space: nowrap;
`;

const MarketCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MarketType = styled.span`
  font-size: 10px;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const MarketLabel = styled.span`
  font-size: 13px;
  color: ${colors.text};
  font-weight: 500;
`;

const MonoValue = styled.span`
  font-feature-settings: 'tnum';
  color: ${colors.text};
`;

const RemoveButton = styled.button`
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
  color: ${colors.danger};
  border: 1px solid ${colors.danger}60;
  background-color: transparent;
  cursor: pointer;
  transition: background-color 0.15s, opacity 0.15s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background-color: ${colors.danger}18;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const ConfirmButton = styled.button`
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #3b82f6;
  border: 1px solid #3b82f660;
  background-color: transparent;
  cursor: pointer;
  transition: background-color 0.15s, opacity 0.15s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background-color: #3b82f618;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;


const EmptyCell = styled.td`
  padding: 40px 14px;
  text-align: center;
  color: ${colors.textMuted};
  font-size: 13px;
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

const COLS = 11;

// ─── Component ────────────────────────────────────────────────────────────────

interface BetsPanelProps {
  adminToken: string;
}

const BetsPanel: React.FC<BetsPanelProps> = ({ adminToken }) => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [fetchedBets, fetchedGames] = await Promise.all([fetchBets(), fetchGames()]);
        if (!cancelled) {
          setBets(fetchedBets);
          setGames(fetchedGames);
          setError(null);
        }
      } catch {
        if (!cancelled) setError('Cannot connect to dev server. Run: node infra/dev-server.js');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const gameMap = Object.fromEntries(games.map((g) => [g.id, g]));

  const handleRemove = async (id: string) => {
    setRemoving((prev) => new Set(prev).add(id));
    try {
      await deleteBet(id);
      setBets((prev) => prev.filter((b) => b.id !== id));
    } catch {
      // silently ignore — bet will reappear on next poll if delete failed
    } finally {
      setRemoving((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const handleConfirmPayment = async (id: string) => {
    setConfirming((prev) => new Set(prev).add(id));
    try {
      const updated = await confirmPayment(id, adminToken);
      setBets((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } catch {
      // silently ignore — state will reconcile on next poll
    } finally {
      setConfirming((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  // Stats
  const awaitingBets = bets.filter((b) => b.status === 'awaiting_payment');
  const activeBets   = bets.filter((b) => b.status === 'pending');
  const totalStaked = bets.filter((b) => b.status !== 'awaiting_payment').reduce((s, b) => s + b.stake, 0);
  const currStaked = activeBets.reduce((s, b) => s + b.stake, 0);
  const pendingCount = activeBets.length;
  const awaitingCount = awaitingBets.length;
  const lossCount = bets.filter((b) => b.status === 'lost').length;
  const wonCount = bets.filter((b) => b.status === 'won').length;
  const potentialPayout = activeBets.reduce((s, b) => s + b.payout, 0);
  const totalWon = bets.filter((b) => b.status === 'won').reduce((s, b) => s + b.payout, 0);

  // Sort: awaiting_payment first, then pending, then settled — newest within each group
  const STATUS_ORDER: Record<BetStatus, number> = { awaiting_payment: 0, pending: 1, won: 2, lost: 3, void: 4 };
  const sortedBets = [...bets].sort((a, b) => {
    if (STATUS_ORDER[a.status] !== STATUS_ORDER[b.status]) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    return new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();
  });

  const header = (
    <thead>
      <tr>
        <Th>Placed</Th>
        <Th>User</Th>
        <Th>Game</Th>
        <Th>Market</Th>
        <Th>Odds</Th>
        <Th>Bet</Th>
        <Th>Cash</Th>
        <Th>To Win</Th>
        <Th>Payout</Th>
        <Th>Status</Th>
        <Th>Actions</Th>
      </tr>
    </thead>
  );

  return (
    <div>
      {loading && <Banner variant="loading">Loading bets…</Banner>}
      {error && <Banner variant="error">{error}</Banner>}

      {!loading && !error && (
        <>
          <StatsRow>
            <StatCard>
              <StatValue style={{ color: '#3b82f6' }}>{awaitingCount}</StatValue>
              <StatLabel>Awaiting Payment</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue style={{ color: '#f59e0b' }}>{pendingCount}</StatValue>
              <StatLabel>Active</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue style={{ color: colors.danger }}>{lossCount}</StatValue>
              <StatLabel>Lost</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue style={{ color: colors.success }}>{wonCount}</StatValue>
              <StatLabel>Won</StatLabel>
            </StatCard>
          </StatsRow>
          <StatsRow>
            <StatCard>
              <StatValue>{formatMoney(currStaked)}</StatValue>
              <StatLabel>Currently Staked</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{formatMoney(potentialPayout)}</StatValue>
              <StatLabel>Potential Payout</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{formatMoney(totalStaked)}</StatValue>
              <StatLabel>Total Staked</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{formatMoney(totalWon)}</StatValue>
              <StatLabel>Total Won</StatLabel>
            </StatCard>
          </StatsRow>
        </>
      )}

      <TableWrap>
        <Table>
          {header}
          <tbody>
            {bets.length === 0 && !loading ? (
              <tr>
                <EmptyCell colSpan={COLS}>No bets placed yet.</EmptyCell>
              </tr>
            ) : (
              sortedBets.map((bet) => {
                const game = gameMap[bet.gameId] as Game | undefined;
                const profit = parseFloat((bet.payout - bet.stake).toFixed(2));

                return (
                  <Tr key={bet.id} highlight={bet.status === 'awaiting_payment'}>
                    {/* Placed */}
                    <Td style={{ whiteSpace: 'nowrap', color: colors.textMuted, fontSize: 12 }}>
                      {formatDate(bet.placedAt)}
                    </Td>

                    {/* User */}
                    <Td style={{fontSize: 12, color: colors.text}}>
                      {(bet as any).userName ?? (bet as any).userId ?? '-'}
                    </Td>

                    {/* Game */}
                    <Td>
                      {game ? (
                        <Matchup>
                          <TeamLine>{game.awayTeam} @ {game.homeTeam}</TeamLine>
                          <LeagueBadge>{game.league}</LeagueBadge>
                        </Matchup>
                      ) : (
                        <span style={{ color: colors.textMuted, fontSize: 12 }}>Game not found</span>
                      )}
                    </Td>

                    {/* Market */}
                    <Td>
                      <MarketCell>
                        <MarketType>{bet.betType}</MarketType>
                        <MarketLabel>{bet.label}</MarketLabel>
                      </MarketCell>
                    </Td>

                    {/* Odds */}
                    <Td>
                      <MonoValue style={{ color: bet.odds > 0 ? colors.success : colors.text, fontWeight: 700 }}>
                        {formatOdds(bet.odds)}
                      </MonoValue>
                    </Td>

                    {/* Bet */}
                    <Td><MonoValue>{formatMoney(bet.stake)}</MonoValue></Td>

                    {/* Cash */}
                    <Td>
                      <MonoValue style={{ color: bet.cashAmount ? colors.text : colors.textMuted }}>
                        {bet.cashAmount ? formatMoney(bet.cashAmount) : '—'}
                      </MonoValue>
                    </Td>

                    {/* To Win */}
                    <Td><MonoValue>{formatMoney(profit)}</MonoValue></Td>

                    {/* Payout */}
                    <Td><MonoValue>{formatMoney(bet.payout)}</MonoValue></Td>

                    {/* Status */}
                    <Td>
                      <StatusBadge status={bet.status}>
                        {bet.status === 'awaiting_payment' ? 'Awaiting' : bet.status}
                      </StatusBadge>
                    </Td>

                    {/* Actions */}
                    <Td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {bet.status === 'awaiting_payment' && (
                          <ConfirmButton
                            onClick={() => handleConfirmPayment(bet.id)}
                            disabled={confirming.has(bet.id)}
                          >
                            {confirming.has(bet.id) ? 'Confirming…' : 'Mark as Paid'}
                          </ConfirmButton>
                        )}
                        <RemoveButton
                          onClick={() => handleRemove(bet.id)}
                          disabled={removing.has(bet.id)}
                        >
                          {removing.has(bet.id) ? 'Removing…' : 'Remove'}
                        </RemoveButton>
                      </div>
                    </Td>
                  </Tr>
                );
              })
            )}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );
};

export default BetsPanel;

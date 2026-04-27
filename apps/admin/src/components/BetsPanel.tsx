import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Bet, Parlay, Game, BetStatus } from '../types';
import { colors } from '../styles/GlobalStyles';
import { fetchBets, deleteBet, confirmPayment, settleBet } from '../api/betsApi';
import { fetchParlays, confirmParlayPayment, settleParlay, deleteParlay } from '../api/parlaysApi';
import { fetchGames } from '../api/gamesApi';

const POLL_INTERVAL_MS = 5000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatOdds = (n: number) => (n > 0 ? `+${n}` : `${n}`);
const formatMoney = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

// ─── Unified item type ────────────────────────────────────────────────────────

type BetItem = { kind: 'bet'; data: Bet } | { kind: 'parlay'; data: Parlay };

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
  min-width: 820px;
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

const LegList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 240px;
`;

const LegItem = styled.div`
  font-size: 12px;
  color: ${colors.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LegLabel = styled.span`
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

  &:hover:not(:disabled) { background-color: ${colors.danger}18; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
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

  &:hover:not(:disabled) { background-color: #3b82f618; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const SettleButton = styled.button<{ variant: 'won' | 'lost' | 'void' }>`
  padding: 4px 8px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  background-color: transparent;
  cursor: pointer;
  transition: background-color 0.15s, opacity 0.15s;
  white-space: nowrap;

  color: ${({ variant }) =>
    variant === 'won'  ? colors.success :
    variant === 'lost' ? colors.danger  : colors.textMuted};
  border: 1px solid ${({ variant }) =>
    variant === 'won'  ? `${colors.success}60` :
    variant === 'lost' ? `${colors.danger}60`  : `${colors.textMuted}60`};

  &:hover:not(:disabled) {
    background-color: ${({ variant }) =>
      variant === 'won'  ? `${colors.success}18` :
      variant === 'lost' ? `${colors.danger}18`  : `${colors.textMuted}18`};
  }

  &:disabled { opacity: 0.4; cursor: not-allowed; }
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

const COLS = 10;

// ─── Component ────────────────────────────────────────────────────────────────

interface BetsPanelProps {
  adminToken: string;
}

const BetsPanel: React.FC<BetsPanelProps> = ({ adminToken }) => {
  const [bets, setBets]       = useState<Bet[]>([]);
  const [parlays, setParlays] = useState<Parlay[]>([]);
  const [games, setGames]     = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [removingBets, setRemovingBets]       = useState<Set<string>>(new Set());
  const [confirmingBets, setConfirmingBets]   = useState<Set<string>>(new Set());
  const [settlingBets, setSettlingBets]       = useState<Set<string>>(new Set());
  const [removingParlays, setRemovingParlays] = useState<Set<string>>(new Set());
  const [confirmingParlays, setConfirmingParlays] = useState<Set<string>>(new Set());
  const [settlingParlays, setSettlingParlays]     = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [fetchedBets, fetchedParlays, fetchedGames] = await Promise.all([
          fetchBets(adminToken),
          fetchParlays(adminToken),
          fetchGames(),
        ]);
        if (!cancelled) {
          setBets(fetchedBets);
          setParlays(fetchedParlays);
          setGames(fetchedGames);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('401') || msg.includes('403') || msg.includes('Unauthorized') || msg.includes('Forbidden')) {
            setError('Session expired — please log out and log back in.');
          } else {
            setError('Cannot connect to server. Check that the API is running.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [adminToken]);

  const gameMap = Object.fromEntries(games.map((g) => [g.id, g]));

  // ── Bet handlers ──────────────────────────────────────────────────────────────

  const handleRemoveBet = async (id: string) => {
    setRemovingBets((prev) => new Set(prev).add(id));
    try {
      await deleteBet(id);
      setBets((prev) => prev.filter((b) => b.id !== id));
    } catch { /* reconcile on next poll */ }
    finally {
      setRemovingBets((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const handleConfirmBetPayment = async (id: string) => {
    setConfirmingBets((prev) => new Set(prev).add(id));
    try {
      const updated = await confirmPayment(id, adminToken);
      setBets((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } catch { /* reconcile on next poll */ }
    finally {
      setConfirmingBets((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const handleSettleBet = async (id: string, outcome: 'won' | 'lost' | 'void') => {
    setSettlingBets((prev) => new Set(prev).add(id));
    try {
      const updated = await settleBet(id, outcome, adminToken);
      setBets((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } catch { /* reconcile on next poll */ }
    finally {
      setSettlingBets((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  // ── Parlay handlers ───────────────────────────────────────────────────────────

  const handleRemoveParlay = async (id: string) => {
    setRemovingParlays((prev) => new Set(prev).add(id));
    try {
      await deleteParlay(id, adminToken);
      setParlays((prev) => prev.filter((p) => p.id !== id));
    } catch { /* reconcile on next poll */ }
    finally {
      setRemovingParlays((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const handleConfirmParlayPayment = async (id: string) => {
    setConfirmingParlays((prev) => new Set(prev).add(id));
    try {
      const updated = await confirmParlayPayment(id, adminToken);
      setParlays((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch { /* reconcile on next poll */ }
    finally {
      setConfirmingParlays((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const handleSettleParlay = async (id: string, outcome: 'won' | 'lost' | 'void') => {
    setSettlingParlays((prev) => new Set(prev).add(id));
    try {
      const updated = await settleParlay(id, outcome, adminToken);
      setParlays((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch { /* reconcile on next poll */ }
    finally {
      setSettlingParlays((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  // ── Stats (combined) ──────────────────────────────────────────────────────────

  const allItems: BetItem[] = [
    ...bets.map((d) => ({ kind: 'bet' as const, data: d })),
    ...parlays.map((d) => ({ kind: 'parlay' as const, data: d })),
  ];

  const awaitingCount   = allItems.filter((i) => i.data.status === 'awaiting_payment').length;
  const pendingCount    = allItems.filter((i) => i.data.status === 'pending').length;
  const lossCount       = allItems.filter((i) => i.data.status === 'lost').length;
  const wonCount        = allItems.filter((i) => i.data.status === 'won').length;
  const currStaked      = allItems.filter((i) => i.data.status === 'pending').reduce((s, i) => s + i.data.stake, 0);
  const potentialPayout = allItems.filter((i) => i.data.status === 'pending').reduce((s, i) => s + i.data.payout, 0);
  const totalStaked     = allItems.filter((i) => i.data.status !== 'awaiting_payment').reduce((s, i) => s + i.data.stake, 0);
  const totalWon        = allItems.filter((i) => i.data.status === 'won').reduce((s, i) => s + i.data.payout, 0);

  // ── Sort: awaiting first, then pending, then settled — newest within group ────

  const STATUS_ORDER: Record<BetStatus, number> = { awaiting_payment: 0, pending: 1, won: 2, lost: 3, void: 4 };
  const sortedItems = [...allItems].sort((a, b) => {
    if (STATUS_ORDER[a.data.status] !== STATUS_ORDER[b.data.status]) {
      return STATUS_ORDER[a.data.status] - STATUS_ORDER[b.data.status];
    }
    return new Date(b.data.placedAt).getTime() - new Date(a.data.placedAt).getTime();
  });

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
          <thead>
            <tr>
              <Th>Placed</Th>
              <Th>User</Th>
              <Th>Game / Legs</Th>
              <Th>Market</Th>
              <Th>Odds</Th>
              <Th>Bet</Th>
              <Th>To Win</Th>
              <Th>Payout</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {allItems.length === 0 && !loading ? (
              <tr>
                <EmptyCell colSpan={COLS}>No bets placed yet.</EmptyCell>
              </tr>
            ) : (
              sortedItems.map((item) => {
                if (item.kind === 'bet') {
                  const bet = item.data;
                  const game = gameMap[bet.gameId] as Game | undefined;
                  const profit = parseFloat((bet.payout - bet.stake).toFixed(2));

                  return (
                    <Tr key={`bet-${bet.id}`} highlight={bet.status === 'awaiting_payment'}>
                      <Td style={{ whiteSpace: 'nowrap', color: colors.textMuted, fontSize: 12 }}>
                        {formatDate(bet.placedAt)}
                      </Td>
                      <Td style={{ fontSize: 12, color: colors.text }}>{bet.userName ?? '-'}</Td>
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
                      <Td>
                        <MarketCell>
                          <MarketType>{bet.betType}</MarketType>
                          <MarketLabel>{bet.label}</MarketLabel>
                        </MarketCell>
                      </Td>
                      <Td>
                        <MonoValue style={{ color: bet.odds > 0 ? colors.success : colors.text, fontWeight: 700 }}>
                          {formatOdds(bet.odds)}
                        </MonoValue>
                      </Td>
                      <Td><MonoValue>{formatMoney(bet.stake)}</MonoValue></Td>
                      <Td>
                        <MonoValue style={{ color: bet.cashAmount ? colors.text : colors.textMuted }}>
                          {bet.cashAmount ? formatMoney(bet.cashAmount) : '—'}
                        </MonoValue>
                      </Td>
                      <Td><MonoValue>{formatMoney(profit)}</MonoValue></Td>
                      <Td><MonoValue>{formatMoney(bet.payout)}</MonoValue></Td>
                      <Td>
                        <StatusBadge status={bet.status}>
                          {bet.status === 'awaiting_payment' ? 'Awaiting' : bet.status}
                        </StatusBadge>
                      </Td>
                      <Td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {bet.status === 'awaiting_payment' && (
                            <ConfirmButton
                              onClick={() => handleConfirmBetPayment(bet.id)}
                              disabled={confirmingBets.has(bet.id)}
                            >
                              {confirmingBets.has(bet.id) ? 'Confirming…' : 'Mark as Paid'}
                            </ConfirmButton>
                          )}
                          {bet.status === 'pending' && (
                            <>
                              <SettleButton variant="won" onClick={() => handleSettleBet(bet.id, 'won')} disabled={settlingBets.has(bet.id)}>Won</SettleButton>
                              <SettleButton variant="lost" onClick={() => handleSettleBet(bet.id, 'lost')} disabled={settlingBets.has(bet.id)}>Lost</SettleButton>
                              <SettleButton variant="void" onClick={() => handleSettleBet(bet.id, 'void')} disabled={settlingBets.has(bet.id)}>Void</SettleButton>
                            </>
                          )}
                          <RemoveButton onClick={() => handleRemoveBet(bet.id)} disabled={removingBets.has(bet.id)}>
                            {removingBets.has(bet.id) ? 'Removing…' : 'Remove'}
                          </RemoveButton>
                        </div>
                      </Td>
                    </Tr>
                  );
                }

                // parlay row
                const parlay = item.data;
                const profit = parseFloat((parlay.payout - parlay.stake).toFixed(2));

                return (
                  <Tr key={`parlay-${parlay.id}`} highlight={parlay.status === 'awaiting_payment'}>
                    <Td style={{ whiteSpace: 'nowrap', color: colors.textMuted, fontSize: 12 }}>
                      {formatDate(parlay.placedAt)}
                    </Td>
                    <Td style={{ fontSize: 12, color: colors.text }}>{parlay.userName ?? '-'}</Td>
                    <Td>
                      <LegList>
                        {parlay.legs.map((leg, i) => {
                          const game = gameMap[leg.gameId] as Game | undefined;
                          return (
                            <LegItem key={i} title={`${leg.label} (${leg.betType})`}>
                              <LegLabel>{leg.label}</LegLabel>
                              {' '}
                              <span style={{ fontSize: 11, color: colors.textMuted }}>
                                {formatOdds(leg.odds)}
                                {game ? ` · ${game.awayTeam} @ ${game.homeTeam}` : ''}
                              </span>
                            </LegItem>
                          );
                        })}
                      </LegList>
                    </Td>
                    <Td>
                      <MarketCell>
                        <MarketType>Parlay</MarketType>
                        <MarketLabel>{parlay.legs.length}-Leg</MarketLabel>
                      </MarketCell>
                    </Td>
                    <Td>
                      <MonoValue style={{ color: parlay.combinedOdds > 0 ? colors.success : colors.text, fontWeight: 700 }}>
                        {formatOdds(parlay.combinedOdds)}
                      </MonoValue>
                    </Td>
                    <Td><MonoValue>{formatMoney(parlay.stake)}</MonoValue></Td>
                    <Td>
                      <MonoValue style={{ color: parlay.cashAmount ? colors.text : colors.textMuted }}>
                        {parlay.cashAmount ? formatMoney(parlay.cashAmount) : '—'}
                      </MonoValue>
                    </Td>
                    <Td><MonoValue>{formatMoney(profit)}</MonoValue></Td>
                    <Td><MonoValue>{formatMoney(parlay.payout)}</MonoValue></Td>
                    <Td>
                      <StatusBadge status={parlay.status}>
                        {parlay.status === 'awaiting_payment' ? 'Awaiting' : parlay.status}
                      </StatusBadge>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {parlay.status === 'awaiting_payment' && (
                          <ConfirmButton
                            onClick={() => handleConfirmParlayPayment(parlay.id)}
                            disabled={confirmingParlays.has(parlay.id)}
                          >
                            {confirmingParlays.has(parlay.id) ? 'Confirming…' : 'Mark as Paid'}
                          </ConfirmButton>
                        )}
                        {parlay.status === 'pending' && (
                          <>
                            <SettleButton variant="won" onClick={() => handleSettleParlay(parlay.id, 'won')} disabled={settlingParlays.has(parlay.id)}>Won</SettleButton>
                            <SettleButton variant="lost" onClick={() => handleSettleParlay(parlay.id, 'lost')} disabled={settlingParlays.has(parlay.id)}>Lost</SettleButton>
                            <SettleButton variant="void" onClick={() => handleSettleParlay(parlay.id, 'void')} disabled={settlingParlays.has(parlay.id)}>Void</SettleButton>
                          </>
                        )}
                        <RemoveButton onClick={() => handleRemoveParlay(parlay.id)} disabled={removingParlays.has(parlay.id)}>
                          {removingParlays.has(parlay.id) ? 'Removing…' : 'Remove'}
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

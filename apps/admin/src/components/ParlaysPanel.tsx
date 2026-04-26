import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Parlay, Game } from '../types';
import { colors } from '../styles/GlobalStyles';
import { fetchParlays, confirmParlayPayment, settleParlay, deleteParlay } from '../api/parlaysApi';
import { fetchGames } from '../api/gamesApi';

const POLL_INTERVAL_MS = 5000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatOdds = (n: number) => (n > 0 ? `+${n}` : `${n}`);
const formatMoney = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

type ParlayStatus = Parlay['status'];

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<ParlayStatus, string> = {
  awaiting_payment: '#3b82f6',
  pending: '#f59e0b',
  won:     colors.success,
  lost:    colors.danger,
  void:    colors.textMuted,
};

const STATUS_BG: Record<ParlayStatus, string> = {
  awaiting_payment: 'rgba(59,130,246,0.12)',
  pending: 'rgba(245,158,11,0.12)',
  won:     'rgba(34,197,94,0.12)',
  lost:    'rgba(239,68,68,0.12)',
  void:    'rgba(123,129,153,0.12)',
};

const StatusBadge = styled.span<{ status: ParlayStatus }>`
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
  min-width: 900px;
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

const MonoValue = styled.span`
  font-feature-settings: 'tnum';
  color: ${colors.text};
`;

const LegList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 260px;
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
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
  background-color: transparent;
  cursor: pointer;
  transition: background-color 0.15s, opacity 0.15s;
  white-space: nowrap;

  color: ${({ variant }) =>
    variant === 'won'  ? colors.success :
    variant === 'lost' ? colors.danger  :
    colors.textMuted};

  border: 1px solid ${({ variant }) =>
    variant === 'won'  ? colors.success + '60' :
    variant === 'lost' ? colors.danger  + '60' :
    colors.textMuted   + '60'};

  &:hover:not(:disabled) {
    background-color: ${({ variant }) =>
      variant === 'won'  ? colors.success + '18' :
      variant === 'lost' ? colors.danger  + '18' :
      colors.textMuted   + '18'};
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

interface ParlaysPanelProps {
  adminToken: string;
}

const ParlaysPanel: React.FC<ParlaysPanelProps> = ({ adminToken }) => {
  const [parlays, setParlays] = useState<Parlay[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<Set<string>>(new Set());
  const [settling, setSettling] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [fetchedParlays, fetchedGames] = await Promise.all([
          fetchParlays(adminToken),
          fetchGames(),
        ]);
        if (!cancelled) {
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

  const handleRemove = async (id: string) => {
    setRemoving((prev) => new Set(prev).add(id));
    try {
      await deleteParlay(id, adminToken);
      setParlays((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // reconcile on next poll
    } finally {
      setRemoving((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const handleConfirmPayment = async (id: string) => {
    setConfirming((prev) => new Set(prev).add(id));
    try {
      const updated = await confirmParlayPayment(id, adminToken);
      setParlays((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch {
      // reconcile on next poll
    } finally {
      setConfirming((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const handleSettle = async (id: string, outcome: 'won' | 'lost' | 'void') => {
    setSettling((prev) => new Set(prev).add(id));
    try {
      const updated = await settleParlay(id, outcome, adminToken);
      setParlays((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch {
      // reconcile on next poll
    } finally {
      setSettling((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  // Stats
  const awaitingCount  = parlays.filter((p) => p.status === 'awaiting_payment').length;
  const pendingCount   = parlays.filter((p) => p.status === 'pending').length;
  const wonCount       = parlays.filter((p) => p.status === 'won').length;
  const lostCount      = parlays.filter((p) => p.status === 'lost').length;
  const currStaked     = parlays.filter((p) => p.status === 'pending').reduce((s, p) => s + p.stake, 0);
  const potentialPayout = parlays.filter((p) => p.status === 'pending').reduce((s, p) => s + p.payout, 0);
  const totalWon       = parlays.filter((p) => p.status === 'won').reduce((s, p) => s + p.payout, 0);

  const STATUS_ORDER: Record<ParlayStatus, number> = { awaiting_payment: 0, pending: 1, won: 2, lost: 3, void: 4 };
  const sortedParlays = [...parlays].sort((a, b) => {
    if (STATUS_ORDER[a.status] !== STATUS_ORDER[b.status]) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    return new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();
  });

  return (
    <div>
      {loading && <Banner variant="loading">Loading parlays…</Banner>}
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
              <StatValue style={{ color: colors.danger }}>{lostCount}</StatValue>
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
              <Th>Legs</Th>
              <Th>Odds</Th>
              <Th>Stake</Th>
              <Th>Cash</Th>
              <Th>To Win</Th>
              <Th>Payout</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {parlays.length === 0 && !loading ? (
              <tr>
                <EmptyCell colSpan={COLS}>No parlays placed yet.</EmptyCell>
              </tr>
            ) : (
              sortedParlays.map((parlay) => {
                const profit = parseFloat((parlay.payout - parlay.stake).toFixed(2));
                const isSettling = settling.has(parlay.id);

                return (
                  <Tr key={parlay.id} highlight={parlay.status === 'awaiting_payment'}>
                    {/* Placed */}
                    <Td style={{ whiteSpace: 'nowrap', color: colors.textMuted, fontSize: 12 }}>
                      {formatDate(parlay.placedAt)}
                    </Td>

                    {/* User */}
                    <Td style={{ fontSize: 12, color: colors.text }}>
                      {parlay.userName ?? '-'}
                    </Td>

                    {/* Legs */}
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

                    {/* Combined Odds */}
                    <Td>
                      <MonoValue style={{ color: parlay.combinedOdds > 0 ? colors.success : colors.text, fontWeight: 700 }}>
                        {formatOdds(parlay.combinedOdds)}
                      </MonoValue>
                    </Td>

                    {/* Stake */}
                    <Td><MonoValue>{formatMoney(parlay.stake)}</MonoValue></Td>

                    {/* Cash */}
                    <Td>
                      <MonoValue style={{ color: parlay.cashAmount ? colors.text : colors.textMuted }}>
                        {parlay.cashAmount ? formatMoney(parlay.cashAmount) : '—'}
                      </MonoValue>
                    </Td>

                    {/* To Win */}
                    <Td><MonoValue>{formatMoney(profit)}</MonoValue></Td>

                    {/* Payout */}
                    <Td><MonoValue>{formatMoney(parlay.payout)}</MonoValue></Td>

                    {/* Status */}
                    <Td>
                      <StatusBadge status={parlay.status}>
                        {parlay.status === 'awaiting_payment' ? 'Awaiting' : parlay.status}
                      </StatusBadge>
                    </Td>

                    {/* Actions */}
                    <Td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {parlay.status === 'awaiting_payment' && (
                          <ConfirmButton
                            onClick={() => handleConfirmPayment(parlay.id)}
                            disabled={confirming.has(parlay.id)}
                          >
                            {confirming.has(parlay.id) ? 'Confirming…' : 'Mark as Paid'}
                          </ConfirmButton>
                        )}
                        {parlay.status === 'pending' && (
                          <>
                            <SettleButton
                              variant="won"
                              onClick={() => handleSettle(parlay.id, 'won')}
                              disabled={isSettling}
                            >
                              Won
                            </SettleButton>
                            <SettleButton
                              variant="lost"
                              onClick={() => handleSettle(parlay.id, 'lost')}
                              disabled={isSettling}
                            >
                              Lost
                            </SettleButton>
                            <SettleButton
                              variant="void"
                              onClick={() => handleSettle(parlay.id, 'void')}
                              disabled={isSettling}
                            >
                              Void
                            </SettleButton>
                          </>
                        )}
                        <RemoveButton
                          onClick={() => handleRemove(parlay.id)}
                          disabled={removing.has(parlay.id)}
                        >
                          {removing.has(parlay.id) ? 'Removing…' : 'Remove'}
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

export default ParlaysPanel;

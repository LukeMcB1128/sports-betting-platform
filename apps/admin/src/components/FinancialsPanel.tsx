import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Bet, Parlay, Game, BetStatus } from '../types';
import { colors } from '../styles/GlobalStyles';
import { fetchBets } from '../api/betsApi';
import { fetchParlays } from '../api/parlaysApi';
import { fetchGames } from '../api/gamesApi';

const POLL_INTERVAL_MS = 15000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatMoney = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatOdds = (n: number) => (n > 0 ? `+${n}` : `${n}`);
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<BetStatus, string> = {
  awaiting_payment: '#3b82f6',
  pending: '#f59e0b',
  won: colors.success,
  lost: colors.danger,
  void: colors.textMuted,
};

const STATUS_BG: Record<BetStatus, string> = {
  awaiting_payment: 'rgba(59,130,246,0.12)',
  pending: 'rgba(245,158,11,0.12)',
  won: 'rgba(34,197,94,0.12)',
  lost: 'rgba(239,68,68,0.12)',
  void: 'rgba(123,129,153,0.12)',
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

// ─── Layout primitives ────────────────────────────────────────────────────────

const Banner = styled.div<{ variant: 'error' | 'loading' }>`
  background-color: ${({ variant }) => (variant === 'error' ? '#3b1212' : colors.surfaceHover)};
  border: 1px solid ${({ variant }) => (variant === 'error' ? colors.danger : colors.border)};
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 24px;
  font-size: 13px;
  color: ${({ variant }) => (variant === 'error' ? colors.danger : colors.textMuted)};
`;

const SectionDivider = styled.hr`
  border: none;
  border-top: 1px solid ${colors.border};
  margin: 32px 0;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 12px;
  flex-wrap: wrap;
`;

const SectionTitle = styled.h3`
  font-size: 11px;
  font-weight: 700;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 14px;
`;

const FilterSelect = styled.select`
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid ${colors.border};
  background-color: ${colors.surface};
  color: ${colors.text};
  font-size: 13px;
  cursor: pointer;

  &:focus { outline: 2px solid ${colors.accent}; outline-offset: 1px; }
`;

// ─── Table primitives ─────────────────────────────────────────────────────────

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid ${colors.border};
  border-radius: 10px;
  margin-bottom: 0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
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

const ThRight = styled(Th)`
  text-align: right;
`;

const Td = styled.td`
  padding: 12px 14px;
  border-bottom: 1px solid ${colors.border};
  vertical-align: middle;
  font-size: 13px;
  color: ${colors.text};

  tr:last-child & { border-bottom: none; }
`;

const TdRight = styled(Td)`
  text-align: right;
  font-feature-settings: 'tnum';
`;

const Tr = styled.tr`
  &:hover td { background-color: ${colors.surfaceHover}; }
`;

const EmptyCell = styled.td`
  padding: 40px 14px;
  text-align: center;
  color: ${colors.textMuted};
  font-size: 13px;
`;

const PreferredBadge = styled.span<{ variant: 'home' | 'away' }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  color: ${({ variant }) => (variant === 'home' ? '#10b981' : '#f59e0b')};
  background-color: ${({ variant }) =>
    variant === 'home' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)'};
  border: 1px solid ${({ variant }) =>
    variant === 'home' ? '#10b98140' : '#f59e0b40'};
`;

// ─── Per-user stats grid ──────────────────────────────────────────────────────

const UserStatsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  border: 1px solid ${colors.border};
  border-radius: 10px;
  overflow: hidden;
`;

const UserStatsTh = styled.th`
  text-align: right;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid ${colors.border};
  background-color: ${colors.surfaceHover};
  white-space: nowrap;

  &:first-child {
    text-align: left;
    border-radius: 10px 0 0 0;
  }
  &:last-child { border-radius: 0 10px 0 0; }
`;

const UserStatsTd = styled.td`
  padding: 11px 14px;
  border-bottom: 1px solid ${colors.border};
  font-size: 13px;
  text-align: right;
  font-feature-settings: 'tnum';
  color: ${colors.text};

  tr:last-child & { border-bottom: none; }

  &:first-child { text-align: left; font-weight: 600; }
`;

const UserStatsTr = styled.tr`
  &:hover td { background-color: ${colors.surfaceHover}; }
`;

// ─── Component ────────────────────────────────────────────────────────────────

interface FinancialsPanelProps {
  adminToken: string;
}

const FinancialsPanel: React.FC<FinancialsPanelProps> = ({ adminToken }) => {
  const [bets, setBets]       = useState<Bet[]>([]);
  const [parlays, setParlays] = useState<Parlay[]>([]);
  const [games, setGames]     = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [userFilter, setUserFilter]     = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [b, p, g] = await Promise.all([
          fetchBets(adminToken),
          fetchParlays(adminToken),
          fetchGames(),
        ]);
        if (!cancelled) {
          setBets(b);
          setParlays(p);
          setGames(g);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('401') || msg.includes('403')) {
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

  // ── Derived: open items only ───────────────────────────────────────────────

  const openBets    = bets.filter((b) => b.status === 'pending' || b.status === 'awaiting_payment');
  const openParlays = parlays.filter((p) => p.status === 'pending' || p.status === 'awaiting_payment');

  // ── Section 1: Per-game liability ─────────────────────────────────────────

  interface GameLiability {
    game: Game;
    homeExposure: number;
    awayExposure: number;
  }

  const liabilityByGame = new Map<string, { homeExp: number; awayExp: number }>();

  const ensureGame = (id: string) => {
    if (!liabilityByGame.has(id)) liabilityByGame.set(id, { homeExp: 0, awayExp: 0 });
    return liabilityByGame.get(id)!;
  };

  for (const b of openBets) {
    const entry = ensureGame(b.gameId);
    if (b.side === 'home') entry.homeExp += b.payout;
    else entry.awayExp += b.payout;
  }

  for (const p of openParlays) {
    for (const leg of p.legs) {
      const entry = ensureGame(leg.gameId);
      if (leg.side === 'home') entry.homeExp += p.payout;
      else entry.awayExp += p.payout;
    }
  }

  const gameMap = new Map(games.map((g) => [g.id, g]));

  const liabilityRows: GameLiability[] = Array.from(liabilityByGame.entries()).reduce<GameLiability[]>(
    (acc, [gameId, { homeExp, awayExp }]) => {
      const game = gameMap.get(gameId);
      if (game) acc.push({ game, homeExposure: homeExp, awayExposure: awayExp });
      return acc;
    },
    []
  );
  liabilityRows.sort((a, b) =>
    Math.abs(b.homeExposure - b.awayExposure) - Math.abs(a.homeExposure - a.awayExposure)
  );

  // ── Section 2: Bets by user ───────────────────────────────────────────────

  type BetItem = { kind: 'bet'; data: Bet } | { kind: 'parlay'; data: Parlay };

  const allItems: BetItem[] = [
    ...bets.map((d) => ({ kind: 'bet' as const, data: d })),
    ...parlays.map((d) => ({ kind: 'parlay' as const, data: d })),
  ];

  const allUserNames = Array.from(
    new Set(allItems.map((i) => i.data.userName).filter(Boolean))
  ).sort();

  const filteredItems = allItems.filter((i) => {
    if (userFilter !== 'all' && i.data.userName !== userFilter) return false;
    if (statusFilter !== 'all' && i.data.status !== statusFilter) return false;
    return true;
  });

  const sortedItems = [...filteredItems].sort(
    (a, b) => new Date(b.data.placedAt).getTime() - new Date(a.data.placedAt).getTime()
  );

  // ── Section 3: Per-user stats ─────────────────────────────────────────────

  interface UserStats {
    userName: string;
    awaitingCount: number;
    awaitingStake: number;
    activeCount: number;
    activeStake: number;
    canWin: number;       // potential profit on pending items
    wonPayout: number;    // gross payout on won items
    lostStake: number;    // stake on lost items
    totalPlaced: number;  // stake on all non-void items
  }

  const userStatsMap = new Map<string, UserStats>();

  const ensureUser = (name: string): UserStats => {
    if (!userStatsMap.has(name)) {
      userStatsMap.set(name, {
        userName: name,
        awaitingCount: 0, awaitingStake: 0,
        activeCount: 0,   activeStake: 0,
        canWin: 0, wonPayout: 0, lostStake: 0, totalPlaced: 0,
      });
    }
    return userStatsMap.get(name)!;
  };

  for (const item of allItems) {
    const { status, stake, payout, userName } = item.data;
    if (!userName) continue;
    const u = ensureUser(userName);

    if (status !== 'void') u.totalPlaced += stake;

    if (status === 'awaiting_payment') {
      u.awaitingCount++;
      u.awaitingStake += stake;
    } else if (status === 'pending') {
      u.activeCount++;
      u.activeStake += stake;
      u.canWin += payout - stake;
    } else if (status === 'won') {
      u.wonPayout += payout;
    } else if (status === 'lost') {
      u.lostStake += stake;
    }
  }

  const userStatsList = Array.from(userStatsMap.values()).sort((a, b) =>
    b.totalPlaced - a.totalPlaced
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {loading && <Banner variant="loading">Loading financials…</Banner>}
      {error && <Banner variant="error">{error}</Banner>}

      {/* ── Section 1: Per-game liability ──────────────────────────────── */}
      <SectionTitle>Per-Game Liability (Open Bets)</SectionTitle>
      <TableWrap>
        <Table style={{ minWidth: 700 }}>
          <thead>
            <tr>
              <Th>Matchup</Th>
              <Th>Home Odds</Th>
              <Th>Away Odds</Th>
              <ThRight>Home Exposure</ThRight>
              <ThRight>Away Exposure</ThRight>
              <Th>Book Prefers</Th>
              <ThRight>Net Diff</ThRight>
            </tr>
          </thead>
          <tbody>
            {liabilityRows.length === 0 && !loading ? (
              <tr>
                <EmptyCell colSpan={7}>No open bets yet.</EmptyCell>
              </tr>
            ) : (
              liabilityRows.map(({ game, homeExposure, awayExposure }) => {
                const netDiff = Math.abs(homeExposure - awayExposure);
                const preferred: 'home' | 'away' = homeExposure <= awayExposure ? 'home' : 'away';
                const mlHome = game.odds?.moneyline?.home;
                const mlAway = game.odds?.moneyline?.away;

                return (
                  <Tr key={game.id}>
                    <Td>
                      <div style={{ fontWeight: 600 }}>{game.awayTeam} @ {game.homeTeam}</div>
                      <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{game.league}</div>
                    </Td>
                    <Td style={{ color: mlHome != null && mlHome > 0 ? colors.success : colors.text, fontWeight: 600 }}>
                      {mlHome != null ? formatOdds(mlHome) : '—'}
                    </Td>
                    <Td style={{ color: mlAway != null && mlAway > 0 ? colors.success : colors.text, fontWeight: 600 }}>
                      {mlAway != null ? formatOdds(mlAway) : '—'}
                    </Td>
                    <TdRight>{formatMoney(homeExposure)}</TdRight>
                    <TdRight>{formatMoney(awayExposure)}</TdRight>
                    <Td>
                      <PreferredBadge variant={preferred}>
                        {preferred === 'home' ? game.homeTeam : game.awayTeam}
                      </PreferredBadge>
                    </Td>
                    <TdRight style={{ fontWeight: 600 }}>{formatMoney(netDiff)}</TdRight>
                  </Tr>
                );
              })
            )}
          </tbody>
        </Table>
      </TableWrap>

      <SectionDivider />

      {/* ── Section 2: Bets by user ────────────────────────────────────── */}
      <SectionHeader>
        <SectionTitle style={{ marginBottom: 0 }}>All Bets &amp; Parlays</SectionTitle>
        <div style={{ display: 'flex', gap: 8 }}>
          <FilterSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="awaiting_payment">Awaiting Payment</option>
            <option value="pending">Pending</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="void">Void</option>
          </FilterSelect>
          <FilterSelect
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="all">All users</option>
            {allUserNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </FilterSelect>
        </div>
      </SectionHeader>
      <TableWrap>
        <Table style={{ minWidth: 680 }}>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>User</Th>
              <Th>Type</Th>
              <Th>Description</Th>
              <ThRight>Stake</ThRight>
              <ThRight>Payout</ThRight>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.length === 0 && !loading ? (
              <tr>
                <EmptyCell colSpan={7}>
                  {userFilter === 'all' && statusFilter === 'all'
                    ? 'No bets placed yet.'
                    : 'No bets match the selected filters.'}
                </EmptyCell>
              </tr>
            ) : (
              sortedItems.map((item) => {
                if (item.kind === 'bet') {
                  const b = item.data;
                  return (
                    <Tr key={`bet-${b.id}`}>
                      <Td style={{ whiteSpace: 'nowrap', color: colors.textMuted, fontSize: 12 }}>
                        {formatDate(b.placedAt)}
                      </Td>
                      <Td style={{ fontWeight: 500 }}>{b.userName ?? '—'}</Td>
                      <Td style={{ color: colors.textMuted, fontSize: 12 }}>Bet</Td>
                      <Td>
                        <div style={{ fontWeight: 500 }}>{b.label}</div>
                        <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                          {b.betType} · {formatOdds(b.odds)}
                        </div>
                      </Td>
                      <TdRight>{formatMoney(b.stake)}</TdRight>
                      <TdRight>{formatMoney(b.payout)}</TdRight>
                      <Td>
                        <StatusBadge status={b.status}>
                          {b.status === 'awaiting_payment' ? 'Awaiting' : b.status}
                        </StatusBadge>
                      </Td>
                    </Tr>
                  );
                }

                const p = item.data;
                const desc = p.legs.map((l) => l.label).join(', ');
                const truncated = desc.length > 60 ? desc.slice(0, 57) + '…' : desc;
                return (
                  <Tr key={`parlay-${p.id}`}>
                    <Td style={{ whiteSpace: 'nowrap', color: colors.textMuted, fontSize: 12 }}>
                      {formatDate(p.placedAt)}
                    </Td>
                    <Td style={{ fontWeight: 500 }}>{p.userName ?? '—'}</Td>
                    <Td style={{ color: colors.textMuted, fontSize: 12 }}>
                      Parlay ({p.legs.length}-leg)
                    </Td>
                    <Td>
                      <div style={{ fontWeight: 500 }} title={desc}>{truncated}</div>
                      <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                        {formatOdds(p.combinedOdds)} combined
                      </div>
                    </Td>
                    <TdRight>{formatMoney(p.stake)}</TdRight>
                    <TdRight>{formatMoney(p.payout)}</TdRight>
                    <Td>
                      <StatusBadge status={p.status}>
                        {p.status === 'awaiting_payment' ? 'Awaiting' : p.status}
                      </StatusBadge>
                    </Td>
                  </Tr>
                );
              })
            )}
          </tbody>
        </Table>
      </TableWrap>

      <SectionDivider />

      {/* ── Section 3: Per-user stats ──────────────────────────────────── */}
      <SectionTitle>Per-User Stats</SectionTitle>
      <TableWrap>
        <UserStatsTable>
          <thead>
            <tr>
              <UserStatsTh style={{ textAlign: 'left' }}>User</UserStatsTh>
              <UserStatsTh>Awaiting Pmt</UserStatsTh>
              <UserStatsTh>Active (Paid)</UserStatsTh>
              <UserStatsTh>Can Win</UserStatsTh>
              <UserStatsTh>Won (Payout)</UserStatsTh>
              <UserStatsTh>Lost (Stake)</UserStatsTh>
              <UserStatsTh>Total Placed</UserStatsTh>
            </tr>
          </thead>
          <tbody>
            {userStatsList.length === 0 && !loading ? (
              <tr>
                <EmptyCell colSpan={7}>No user data yet.</EmptyCell>
              </tr>
            ) : (
              userStatsList.map((u) => (
                <UserStatsTr key={u.userName}>
                  <UserStatsTd>{u.userName}</UserStatsTd>
                  <UserStatsTd>
                    {u.awaitingCount > 0 ? (
                      <>
                        <span style={{ color: '#3b82f6', fontWeight: 700 }}>{u.awaitingCount}</span>
                        <span style={{ color: colors.textMuted, fontSize: 12 }}> · {formatMoney(u.awaitingStake)}</span>
                      </>
                    ) : (
                      <span style={{ color: colors.textMuted }}>—</span>
                    )}
                  </UserStatsTd>
                  <UserStatsTd>
                    {u.activeCount > 0 ? (
                      <>
                        <span style={{ color: '#f59e0b', fontWeight: 700 }}>{u.activeCount}</span>
                        <span style={{ color: colors.textMuted, fontSize: 12 }}> · {formatMoney(u.activeStake)}</span>
                      </>
                    ) : (
                      <span style={{ color: colors.textMuted }}>—</span>
                    )}
                  </UserStatsTd>
                  <UserStatsTd>
                    {u.canWin > 0 ? (
                      <span style={{ color: colors.success, fontWeight: 600 }}>{formatMoney(u.canWin)}</span>
                    ) : (
                      <span style={{ color: colors.textMuted }}>—</span>
                    )}
                  </UserStatsTd>
                  <UserStatsTd>
                    {u.wonPayout > 0 ? (
                      <span style={{ color: colors.success, fontWeight: 600 }}>{formatMoney(u.wonPayout)}</span>
                    ) : (
                      <span style={{ color: colors.textMuted }}>—</span>
                    )}
                  </UserStatsTd>
                  <UserStatsTd>
                    {u.lostStake > 0 ? (
                      <span style={{ color: colors.danger, fontWeight: 600 }}>{formatMoney(u.lostStake)}</span>
                    ) : (
                      <span style={{ color: colors.textMuted }}>—</span>
                    )}
                  </UserStatsTd>
                  <UserStatsTd style={{ fontWeight: 600 }}>{formatMoney(u.totalPlaced)}</UserStatsTd>
                </UserStatsTr>
              ))
            )}
          </tbody>
        </UserStatsTable>
      </TableWrap>
    </div>
  );
};

export default FinancialsPanel;

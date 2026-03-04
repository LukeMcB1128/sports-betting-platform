import React, { useState, useEffect, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { colors } from '../styles/GlobalStyles';
import {
  fetchUsers,
  fetchSignInLog,
  updateUserStatus,
  deleteUser,
  AdminUser,
  SignInLogEntry,
} from '../api/usersApi';

// ── Layout ──────────────────────────────────────────────────────────────────────

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const LogRow = styled.div`
  grid-column: 1 / -1;   /* sign-in log spans both columns */
`;

// ── Cards ───────────────────────────────────────────────────────────────────────

const Card = styled.div`
  background-color: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid ${colors.border};
  background-color: ${colors.surfaceHover};
  flex-shrink: 0;
`;

const CardTitle = styled.div<{ $color?: string }>`
  font-size: 11px;
  font-weight: 700;
  color: ${({ $color }) => $color ?? colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CountBadge = styled.span<{ $bg?: string }>`
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  background-color: ${({ $bg }) => $bg ?? colors.border};
  color: ${colors.text};
`;

const RefreshBtn = styled.button`
  font-size: 11px;
  color: ${colors.accent};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  &:hover { text-decoration: underline; }
`;

const CardBody = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: 340px;
`;

const EmptyNote = styled.div`
  padding: 20px 16px;
  font-size: 13px;
  color: ${colors.textMuted};
  text-align: center;
`;

// ── User rows ───────────────────────────────────────────────────────────────────

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid ${colors.border};

  &:last-child { border-bottom: none; }
  &:hover { background-color: ${colors.surfaceHover}; }
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserDate = styled.div`
  font-size: 11px;
  color: ${colors.textMuted};
  margin-top: 2px;
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

const Btn = styled.button<{ $variant: 'accept' | 'deny' | 'reset' }>`
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid transparent;
  cursor: pointer;
  transition: opacity 0.15s;

  ${({ $variant }) =>
    $variant === 'accept' && css`
      background-color: ${colors.success};
      color: #0f1117;
      &:hover { opacity: 0.82; }
    `}

  ${({ $variant }) =>
    $variant === 'deny' && css`
      background-color: ${colors.danger};
      color: #fff;
      &:hover { opacity: 0.82; }
    `}

  ${({ $variant }) =>
    $variant === 'reset' && css`
      background-color: transparent;
      border-color: ${colors.border};
      color: ${colors.textMuted};
      &:hover { background-color: ${colors.surfaceHover}; color: ${colors.text}; }
    `}
`;

// ── Log table ───────────────────────────────────────────────────────────────────

const LogTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const LogTh = styled.th`
  text-align: left;
  padding: 8px 16px;
  font-size: 11px;
  font-weight: 600;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid ${colors.border};
  background-color: ${colors.surfaceHover};
  white-space: nowrap;
`;

const LogTd = styled.td`
  padding: 9px 16px;
  font-size: 12px;
  border-bottom: 1px solid ${colors.border};
  vertical-align: middle;
  tr:last-child & { border-bottom: none; }
`;

const LogDot = styled.span<{ $success: boolean }>`
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: ${({ $success }) => ($success ? colors.success : colors.danger)};
  margin-right: 8px;
  flex-shrink: 0;
`;

// ── Helpers ─────────────────────────────────────────────────────────────────────

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

// ── Component ───────────────────────────────────────────────────────────────────

interface UsersPanelProps {
  adminToken: string;
}

const UsersPanel: React.FC<UsersPanelProps> = ({ adminToken }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [log, setLog]     = useState<SignInLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [u, l] = await Promise.all([
        fetchUsers(adminToken),
        fetchSignInLog(adminToken),
      ]);
      setUsers(u);
      setLog(l);
    } catch { /* dev server may be down */ }
    finally { setLoading(false); }
  }, [adminToken]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const setStatus = async (userId: string, status: 'verified' | 'denied' | 'pending') => {
    try {
      const updated = await updateUserStatus(adminToken, userId, status);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch { /* silent */ }
  };

  const removeUser = async (userId: string) => {
    try {
      await deleteUser(adminToken, userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch { /* silent */ }
  };

  const pending  = users.filter((u) => u.status === 'pending');
  const denied   = users.filter((u) => u.status === 'denied');
  const verified = users.filter((u) => u.status === 'verified');

  if (loading) {
    return <EmptyNote>Loading…</EmptyNote>;
  }

  return (
    <Grid>

      {/* ── Pending ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle $color={pending.length ? colors.accent : undefined}>
            Pending Requests
          </CardTitle>
          <HeaderRight>
            <CountBadge $bg={pending.length ? colors.accent : undefined}>
              {pending.length}
            </CountBadge>
            <RefreshBtn onClick={load}>↻ Refresh</RefreshBtn>
          </HeaderRight>
        </CardHeader>
        <CardBody>
          {pending.length === 0
            ? <EmptyNote>No pending requests</EmptyNote>
            : pending.map((u) => (
              <UserRow key={u.id}>
                <UserInfo>
                  <UserName>{u.firstName} {u.lastName}</UserName>
                  <UserDate>Requested {fmt(u.createdAt)}</UserDate>
                </UserInfo>
                <ActionGroup>
                  <Btn $variant="accept" onClick={() => setStatus(u.id, 'verified')}>Accept</Btn>
                  <Btn $variant="deny"   onClick={() => setStatus(u.id, 'denied')}>Deny</Btn>
                </ActionGroup>
              </UserRow>
            ))
          }
        </CardBody>
      </Card>

      {/* ── Denied ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle $color={colors.danger}>Denied</CardTitle>
          <CountBadge $bg={denied.length ? `${colors.danger}44` : undefined}>
            {denied.length}
          </CountBadge>
        </CardHeader>
        <CardBody>
          {denied.length === 0
            ? <EmptyNote>No denied users</EmptyNote>
            : denied.map((u) => (
              <UserRow key={u.id}>
                <UserInfo>
                  <UserName>{u.firstName} {u.lastName}</UserName>
                  <UserDate>{fmt(u.createdAt)}</UserDate>
                </UserInfo>
                <ActionGroup>
                  <Btn $variant="accept" onClick={() => setStatus(u.id, 'verified')}>Accept</Btn>
                  <Btn $variant="reset"  onClick={() => setStatus(u.id, 'pending')}>Reset</Btn>
                  <Btn $variant="deny"   onClick={() => removeUser(u.id)}>Remove</Btn>
                </ActionGroup>
              </UserRow>
            ))
          }
        </CardBody>
      </Card>

      {/* ── Verified ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle $color={colors.success}>Verified</CardTitle>
          <CountBadge $bg={verified.length ? `${colors.success}44` : undefined}>
            {verified.length}
          </CountBadge>
        </CardHeader>
        <CardBody>
          {verified.length === 0
            ? <EmptyNote>No verified users</EmptyNote>
            : verified.map((u) => (
              <UserRow key={u.id}>
                <UserInfo>
                  <UserName>{u.firstName} {u.lastName}</UserName>
                  <UserDate>{fmt(u.createdAt)}</UserDate>
                </UserInfo>
                <ActionGroup>
                  <Btn $variant="deny"  onClick={() => setStatus(u.id, 'denied')}>Deny</Btn>
                  <Btn $variant="reset" onClick={() => setStatus(u.id, 'pending')}>Reset</Btn>
                </ActionGroup>
              </UserRow>
            ))
          }
        </CardBody>
      </Card>

      {/* ── Sign-in log — spans full width ────────────────────────────────── */}
      <LogRow>
        <Card>
          <CardHeader>
            <CardTitle>Sign-in Log</CardTitle>
            <CountBadge>{log.length}</CountBadge>
          </CardHeader>
          <CardBody style={{ maxHeight: 300 }}>
            {log.length === 0
              ? <EmptyNote>No sign-in attempts yet</EmptyNote>
              : (
                <LogTable>
                  <thead>
                    <tr>
                      <LogTh>User</LogTh>
                      <LogTh>Result</LogTh>
                      <LogTh>Reason</LogTh>
                      <LogTh>Time</LogTh>
                    </tr>
                  </thead>
                  <tbody>
                    {log.slice(0, 50).map((e) => (
                      <tr key={e.id}>
                        <LogTd style={{ fontWeight: 600, color: colors.text }}>
                          <LogDot $success={e.success} />
                          {e.name}
                        </LogTd>
                        <LogTd style={{ color: e.success ? colors.success : colors.danger }}>
                          {e.success ? 'Allowed' : 'Blocked'}
                        </LogTd>
                        <LogTd style={{ color: colors.textMuted }}>{e.reason}</LogTd>
                        <LogTd style={{ color: colors.textMuted, whiteSpace: 'nowrap' }}>
                          {fmt(e.timestamp)}
                        </LogTd>
                      </tr>
                    ))}
                  </tbody>
                </LogTable>
              )
            }
            {log.length > 50 && (
              <EmptyNote>{log.length - 50} older entries not shown</EmptyNote>
            )}
          </CardBody>
        </Card>
      </LogRow>

    </Grid>
  );
};

export default UsersPanel;

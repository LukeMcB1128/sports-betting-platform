import React, { useState, useEffect, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { colors } from '../styles/GlobalStyles';
import {
  fetchUsers,
  fetchSignInLog,
  updateUserStatus,
  AdminUser,
  SignInLogEntry,
} from '../api/usersApi';

// ── Layout ──────────────────────────────────────────────────────────────────────

const Panel = styled.aside`
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-self: flex-start;
  position: sticky;
  top: 72px;               /* below the 56px nav + padding */
  max-height: calc(100vh - 88px);
  overflow-y: auto;
`;

const Card = styled.div`
  background-color: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: 10px;
  overflow: hidden;
`;

const CardHeader = styled.div<{ $accent?: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid ${colors.border};
  background-color: ${colors.surfaceHover};
`;

const CardTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

const CountBadge = styled.span<{ $color?: string }>`
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  background-color: ${({ $color }) => $color ?? colors.border};
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
  padding: 6px 0;
`;

const EmptyNote = styled.div`
  padding: 12px 14px;
  font-size: 12px;
  color: ${colors.textMuted};
  text-align: center;
`;

// ── User rows ───────────────────────────────────────────────────────────────────

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-bottom: 1px solid ${colors.border};

  &:last-child { border-bottom: none; }
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
  margin-top: 1px;
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 5px;
  flex-shrink: 0;
`;

const Btn = styled.button<{ $variant: 'accept' | 'deny' | 'reset' }>`
  padding: 3px 9px;
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

// ── Log rows ────────────────────────────────────────────────────────────────────

const LogRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border-bottom: 1px solid ${colors.border};

  &:last-child { border-bottom: none; }
`;

const LogDot = styled.span<{ $success: boolean }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background-color: ${({ $success }) => ($success ? colors.success : colors.danger)};
`;

const LogName = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${colors.text};
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LogMeta = styled.div`
  font-size: 10px;
  color: ${colors.textMuted};
  text-align: right;
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
    } catch {
      // dev server may be down
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    load();
    // Refresh every 15 seconds so pending requests appear without manual refresh
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const setStatus = async (userId: string, status: 'verified' | 'denied' | 'pending') => {
    try {
      const updated = await updateUserStatus(adminToken, userId, status);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch { /* silent */ }
  };

  const pending  = users.filter((u) => u.status === 'pending');
  const denied   = users.filter((u) => u.status === 'denied');
  const verified = users.filter((u) => u.status === 'verified');

  if (loading) {
    return (
      <Panel>
        <Card>
          <CardBody>
            <EmptyNote>Loading…</EmptyNote>
          </CardBody>
        </Card>
      </Panel>
    );
  }

  return (
    <Panel>

      {/* ── Pending ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Pending</CardTitle>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <CountBadge $color={pending.length ? colors.accent : undefined}>
              {pending.length}
            </CountBadge>
            <RefreshBtn onClick={load}>↻</RefreshBtn>
          </div>
        </CardHeader>
        <CardBody>
          {pending.length === 0
            ? <EmptyNote>No pending requests</EmptyNote>
            : pending.map((u) => (
              <UserRow key={u.id}>
                <UserInfo>
                  <UserName>{u.firstName} {u.lastName}</UserName>
                  <UserDate>{fmt(u.createdAt)}</UserDate>
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

      {/* ── Denied ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle style={{ color: colors.danger }}>Denied</CardTitle>
          <CountBadge $color={denied.length ? `${colors.danger}33` : undefined}>
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
                </ActionGroup>
              </UserRow>
            ))
          }
        </CardBody>
      </Card>

      {/* ── Verified ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle style={{ color: colors.success }}>Verified</CardTitle>
          <CountBadge $color={verified.length ? `${colors.success}33` : undefined}>
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

      {/* ── Sign-in log ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Sign-in Log</CardTitle>
          <CountBadge>{log.length}</CountBadge>
        </CardHeader>
        <CardBody>
          {log.length === 0
            ? <EmptyNote>No attempts yet</EmptyNote>
            : log.slice(0, 25).map((e) => (
              <LogRow key={e.id}>
                <LogDot $success={e.success} />
                <LogName>{e.name}</LogName>
                <LogMeta>
                  <div>{e.reason}</div>
                  <div>{fmt(e.timestamp)}</div>
                </LogMeta>
              </LogRow>
            ))
          }
          {log.length > 25 && (
            <EmptyNote>{log.length - 25} older entries hidden</EmptyNote>
          )}
        </CardBody>
      </Card>

    </Panel>
  );
};

export default UsersPanel;

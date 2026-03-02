import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { colors } from '../styles/GlobalStyles';
import {
  fetchUsers,
  fetchSignInLog,
  updateUserStatus,
  adminLogout,
  AdminUser,
  SignInLogEntry,
} from '../api/usersApi';

// ── Animations ──────────────────────────────────────────────────────────────────

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ── Nav layout ──────────────────────────────────────────────────────────────────

const Nav = styled.nav`
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: ${colors.surface};
  border-bottom: 1px solid ${colors.border};
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 16px;
`;

const Logo = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: ${colors.accent};
  letter-spacing: -0.5px;
`;

const AdminBadge = styled.span`
  background-color: ${colors.accent};
  color: ${colors.accentText};
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const Spacer = styled.div`
  flex: 1;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
`;

// ── Users dropdown trigger button ───────────────────────────────────────────────

const TriggerButton = styled.button<{ $open: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 8px;
  background-color: ${({ $open }) => ($open ? colors.surfaceHover : 'transparent')};
  border: 1px solid ${({ $open }) => ($open ? colors.border : 'transparent')};
  color: ${colors.text};
  font-size: 13px;
  font-weight: 600;
  transition: background-color 0.15s, border-color 0.15s;

  &:hover {
    background-color: ${colors.surfaceHover};
    border-color: ${colors.border};
  }
`;

const PendingBadge = styled.span`
  background-color: ${colors.accent};
  color: ${colors.accentText};
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
`;

const Chevron = styled.span<{ $open: boolean }>`
  font-size: 10px;
  transition: transform 0.2s;
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  color: ${colors.textMuted};
`;

const SignOutButton = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: ${colors.textMuted};
  border: 1px solid ${colors.border};
  background: none;
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background-color: ${colors.surfaceHover};
    color: ${colors.text};
  }
`;

// ── Dropdown panel ──────────────────────────────────────────────────────────────

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 380px;
  max-height: 520px;
  overflow-y: auto;
  background-color: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  animation: ${slideDown} 0.18s ease;
  z-index: 200;
`;

const Section = styled.div`
  padding: 14px 16px 8px;

  & + & {
    border-top: 1px solid ${colors.border};
  }
`;

const SectionTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionBadge = styled.span`
  background-color: ${colors.surfaceHover};
  color: ${colors.textMuted};
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
`;

const EmptyNote = styled.div`
  font-size: 12px;
  color: ${colors.textMuted};
  padding: 8px 0 10px;
  text-align: center;
`;

// ── User rows ───────────────────────────────────────────────────────────────────

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid ${colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const UserName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.text};
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserMeta = styled.div`
  font-size: 11px;
  color: ${colors.textMuted};
`;

const UserActions = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

const ActionBtn = styled.button<{ $variant: 'accept' | 'deny' | 'reset' }>`
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid transparent;
  transition: opacity 0.15s;

  ${({ $variant }) =>
    $variant === 'accept' &&
    css`
      background-color: ${colors.success};
      color: #0f1117;
      &:hover { opacity: 0.85; }
    `}

  ${({ $variant }) =>
    $variant === 'deny' &&
    css`
      background-color: ${colors.danger};
      color: #fff;
      &:hover { opacity: 0.85; }
    `}

  ${({ $variant }) =>
    $variant === 'reset' &&
    css`
      background-color: transparent;
      border-color: ${colors.border};
      color: ${colors.textMuted};
      &:hover { background-color: ${colors.surfaceHover}; color: ${colors.text}; }
    `}
`;

const StatusBadge = styled.span<{ $status: 'pending' | 'verified' | 'denied' }>`
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  flex-shrink: 0;

  ${({ $status }) =>
    $status === 'verified' &&
    css`background-color: #122d1e; color: ${colors.success};`}

  ${({ $status }) =>
    $status === 'denied' &&
    css`background-color: #2d1414; color: ${colors.danger};`}

  ${({ $status }) =>
    $status === 'pending' &&
    css`background-color: #2a2210; color: #f59e0b;`}
`;

// ── Log rows ────────────────────────────────────────────────────────────────────

const LogRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid ${colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const LogDot = styled.span<{ $success: boolean }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background-color: ${({ $success }) => ($success ? colors.success : colors.danger)};
`;

const LogName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.text};
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LogMeta = styled.div`
  font-size: 11px;
  color: ${colors.textMuted};
  text-align: right;
  flex-shrink: 0;
`;

const RefreshBtn = styled.button`
  font-size: 11px;
  color: ${colors.accent};
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  margin-left: auto;

  &:hover { text-decoration: underline; }
`;

// ── Helpers ─────────────────────────────────────────────────────────────────────

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// ── Component ───────────────────────────────────────────────────────────────────

interface NavBarProps {
  adminToken: string;
  onLogout: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ adminToken, onLogout }) => {
  const [open, setOpen]           = useState(false);
  const [users, setUsers]         = useState<AdminUser[]>([]);
  const [log, setLog]             = useState<SignInLogEntry[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pendingUsers    = users.filter((u) => u.status === 'pending');
  const nonPendingUsers = users.filter((u) => u.status !== 'pending');

  const loadData = useCallback(async () => {
    if (!adminToken) return;
    setLoadingUsers(true);
    try {
      const [u, l] = await Promise.all([
        fetchUsers(adminToken),
        fetchSignInLog(adminToken),
      ]);
      setUsers(u);
      setLog(l);
    } catch {
      // silent — dev server may not be running
    } finally {
      setLoadingUsers(false);
    }
  }, [adminToken]);

  // Load data on open
  useEffect(() => {
    if (open) loadData();
  }, [open, loadData]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleStatusChange = async (
    userId: string,
    status: 'verified' | 'denied' | 'pending',
  ) => {
    try {
      const updated = await updateUserStatus(adminToken, userId, status);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch {
      // silent
    }
  };

  const handleLogout = async () => {
    await adminLogout(adminToken);
    onLogout();
  };

  return (
    <Nav>
      <Logo>CTXSB</Logo>
      <AdminBadge>Admin</AdminBadge>
      <Spacer />

      <RightSection ref={dropdownRef}>
        {/* Users trigger */}
        <TriggerButton $open={open} onClick={() => setOpen((v) => !v)}>
          Users
          {pendingUsers.length > 0 && (
            <PendingBadge>{pendingUsers.length}</PendingBadge>
          )}
          <Chevron $open={open}>▼</Chevron>
        </TriggerButton>

        <SignOutButton onClick={handleLogout}>Sign Out</SignOutButton>

        {/* Dropdown */}
        {open && (
          <Dropdown>

            {/* ── Pending requests ─────────────────────────────────────── */}
            <Section>
              <SectionTitle>
                Pending Requests
                <SectionBadge>{pendingUsers.length}</SectionBadge>
                <RefreshBtn onClick={loadData}>↻ Refresh</RefreshBtn>
              </SectionTitle>

              {loadingUsers && (
                <EmptyNote>Loading…</EmptyNote>
              )}

              {!loadingUsers && pendingUsers.length === 0 && (
                <EmptyNote>No pending requests</EmptyNote>
              )}

              {pendingUsers.map((user) => (
                <UserRow key={user.id}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <UserName>{user.firstName} {user.lastName}</UserName>
                    <UserMeta>{formatTime(user.createdAt)}</UserMeta>
                  </div>
                  <UserActions>
                    <ActionBtn
                      $variant="accept"
                      onClick={() => handleStatusChange(user.id, 'verified')}
                    >
                      Accept
                    </ActionBtn>
                    <ActionBtn
                      $variant="deny"
                      onClick={() => handleStatusChange(user.id, 'denied')}
                    >
                      Deny
                    </ActionBtn>
                  </UserActions>
                </UserRow>
              ))}
            </Section>

            {/* ── All users ────────────────────────────────────────────── */}
            {nonPendingUsers.length > 0 && (
              <Section>
                <SectionTitle>
                  All Users
                  <SectionBadge>{nonPendingUsers.length}</SectionBadge>
                </SectionTitle>

                {nonPendingUsers.map((user) => (
                  <UserRow key={user.id}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <UserName>{user.firstName} {user.lastName}</UserName>
                      <UserMeta>{formatTime(user.createdAt)}</UserMeta>
                    </div>
                    <StatusBadge $status={user.status}>{user.status}</StatusBadge>
                    <UserActions>
                      {user.status === 'denied' && (
                        <ActionBtn
                          $variant="accept"
                          onClick={() => handleStatusChange(user.id, 'verified')}
                        >
                          Accept
                        </ActionBtn>
                      )}
                      {user.status === 'verified' && (
                        <ActionBtn
                          $variant="deny"
                          onClick={() => handleStatusChange(user.id, 'denied')}
                        >
                          Deny
                        </ActionBtn>
                      )}
                      <ActionBtn
                        $variant="reset"
                        onClick={() => handleStatusChange(user.id, 'pending')}
                        title="Reset to pending"
                      >
                        Reset
                      </ActionBtn>
                    </UserActions>
                  </UserRow>
                ))}
              </Section>
            )}

            {/* ── Sign-in log ──────────────────────────────────────────── */}
            <Section>
              <SectionTitle>
                Sign-in Log
                <SectionBadge>{log.length}</SectionBadge>
              </SectionTitle>

              {log.length === 0 && !loadingUsers && (
                <EmptyNote>No sign-in attempts yet</EmptyNote>
              )}

              {log.slice(0, 20).map((entry) => (
                <LogRow key={entry.id}>
                  <LogDot $success={entry.success} />
                  <LogName>{entry.name}</LogName>
                  <LogMeta>
                    <div>{entry.reason}</div>
                    <div>{formatTime(entry.timestamp)}</div>
                  </LogMeta>
                </LogRow>
              ))}

              {log.length > 20 && (
                <EmptyNote style={{ paddingTop: 8 }}>
                  Showing 20 of {log.length} entries
                </EmptyNote>
              )}
            </Section>

          </Dropdown>
        )}
      </RightSection>
    </Nav>
  );
};

export default NavBar;

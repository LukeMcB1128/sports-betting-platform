import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { colors } from '../styles/GlobalStyles';
import { fetchUsers, adminLogout } from '../api/usersApi';

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
`;

const PendingChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid ${colors.border};
  background-color: ${colors.surfaceHover};
  font-size: 12px;
  color: ${colors.textMuted};
`;

const PendingCount = styled.span<{ $hasItems: boolean }>`
  font-size: 11px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  background-color: ${({ $hasItems }) => ($hasItems ? colors.accent : colors.border)};
  color: ${({ $hasItems }) => ($hasItems ? colors.accentText : colors.textMuted)};
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

// ── Component ───────────────────────────────────────────────────────────────────

interface NavBarProps {
  adminToken: string;
  onLogout: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ adminToken, onLogout }) => {
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPending = useCallback(async () => {
    try {
      const users = await fetchUsers(adminToken);
      setPendingCount(users.filter((u) => u.status === 'pending').length);
    } catch { /* silent */ }
  }, [adminToken]);

  // Poll pending count every 15 seconds
  useEffect(() => {
    refreshPending();
    const t = setInterval(refreshPending, 15000);
    return () => clearInterval(t);
  }, [refreshPending]);

  const handleLogout = async () => {
    await adminLogout(adminToken);
    onLogout();
  };

  return (
    <Nav>
      <Logo>CTXSB</Logo>
      <AdminBadge>Admin</AdminBadge>
      <Spacer />
      <RightSection>
        <PendingChip>
          Pending
          <PendingCount $hasItems={pendingCount > 0}>{pendingCount}</PendingCount>
        </PendingChip>
        <SignOutButton onClick={handleLogout}>Sign Out</SignOutButton>
      </RightSection>
    </Nav>
  );
};

export default NavBar;

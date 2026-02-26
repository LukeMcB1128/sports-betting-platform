import React from 'react';
import styled from 'styled-components';
import { colors } from '../styles/GlobalStyles';

interface NavBarProps {
  balance: number | null;
}

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
  gap: 32px;
`;

const Logo = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: ${colors.accent};
  letter-spacing: -0.5px;
  flex-shrink: 0;
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
`;

const NavLink = styled.a<{ active?: boolean }>`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ active }) => (active ? colors.text : colors.textMuted)};
  background-color: ${({ active }) => (active ? colors.surfaceHover : 'transparent')};
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background-color: ${colors.surfaceHover};
    color: ${colors.text};
  }
`;

const AdminLink = styled.a`
  padding: 5px 11px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: ${colors.textMuted};
  border: 1px solid ${colors.border};
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
  flex-shrink: 0;

  &:hover {
    background-color: ${colors.surfaceHover};
    color: ${colors.text};
    border-color: ${colors.textMuted};
  }
`;

const BalanceChip = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${colors.surfaceHover};
  border: 1px solid ${colors.border};
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
`;

const BalanceLabel = styled.span`
  color: ${colors.textMuted};
  font-weight: 400;
  font-size: 12px;
`;

const formatBalance = (n: number): string =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const NavBar: React.FC<NavBarProps> = ({ balance }) => {
  const isMyBets = window.location.pathname === '/bets';

  return (
    <Nav>
      <Logo>CTXSB</Logo>
      <NavLinks>
        <NavLink href="/" active={!isMyBets}>Games</NavLink>
        <NavLink href="/bets" active={isMyBets}>My Bets</NavLink>
      </NavLinks>
      <AdminLink href="http://localhost:3001" target="_blank" rel="noreferrer">
        Admin
      </AdminLink>
      <BalanceChip>
        <BalanceLabel>Balance</BalanceLabel>
        {balance !== null ? `$${formatBalance(balance)}` : '—'}
      </BalanceChip>
    </Nav>
  );
};

export default NavBar;

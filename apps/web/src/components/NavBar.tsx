import React from 'react';
import styled from 'styled-components';
import { colors } from '../styles/GlobalStyles';

interface NavBarProps {
  userName: string;
  onSignOut: () => void;
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

  /* Mobile: wrap into two rows */
  @media (max-width: 768px) {
    height: auto;
    flex-wrap: wrap;
    padding: 10px 16px 0;
    gap: 0;
  }
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

  /* Mobile: move to second row, full width, add top border */
  @media (max-width: 768px) {
    order: 3;
    flex: 0 0 100%;
    border-top: 1px solid ${colors.border};
    margin-top: 8px;
    padding: 4px 0;
    gap: 2px;
  }
`;

const NavLink = styled.a<{ active?: boolean }>`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ active }) => (active ? colors.text : colors.textMuted)};
  background-color: ${({ active }) => (active ? colors.surfaceHover : 'transparent')};
  transition: background-color 0.15s, color 0.15s;
  white-space: nowrap;

  &:hover {
    background-color: ${colors.surfaceHover};
    color: ${colors.text};
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;

  /* Mobile: push to far right on top row */
  @media (max-width: 768px) {
    margin-left: auto;
    gap: 8px;
  }
`;

const UserName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.text};

  /* Hide username on mobile — not enough room */
  @media (max-width: 768px) {
    display: none;
  }
`;

const SignOutButton = styled.button`
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: ${colors.textMuted};
  border: 1px solid ${colors.border};
  background: none;
  white-space: nowrap;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;

  &:hover {
    background-color: ${colors.surfaceHover};
    color: ${colors.text};
    border-color: ${colors.textMuted};
  }

  @media (max-width: 768px) {
    padding: 5px 10px;
    font-size: 11px;
  }
`;

const NavBar: React.FC<NavBarProps> = ({ userName, onSignOut }) => {
  const isMyBets = window.location.pathname === '/bets';

  return (
    <Nav>
      <Logo>CTXSB</Logo>
      <NavLinks>
        <NavLink href="/" active={!isMyBets}>Games</NavLink>
        <NavLink href="/bets" active={isMyBets}>My Bets</NavLink>
      </NavLinks>
      <RightSection>
        <UserName>{userName}</UserName>
        <SignOutButton onClick={onSignOut}>Sign Out</SignOutButton>
      </RightSection>
    </Nav>
  );
};

export default NavBar;

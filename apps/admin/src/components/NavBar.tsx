import React from 'react';
import styled from 'styled-components';
import { colors } from '../styles/GlobalStyles';

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

const NavBar: React.FC = () => (
  <Nav>
    <Logo>SBP</Logo>
    <AdminBadge>Admin</AdminBadge>
    <Spacer />
  </Nav>
);

export default NavBar;

import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { colors } from '../styles/GlobalStyles';
import { useParlay } from '../context/ParlayContext';
import ParlaySlip from './ParlaySlip';

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Bar = styled.button`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  background-color: ${colors.accent};
  color: #fff;
  border: none;
  border-radius: 50px;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 24px rgba(59, 130, 246, 0.4);
  cursor: pointer;
  transition: background-color 0.15s, transform 0.15s;
  animation: ${slideUp} 0.2s ease;
  white-space: nowrap;

  &:hover {
    background-color: ${colors.accentHover};
    transform: translateX(-50%) translateY(-2px);
  }
  &:active {
    transform: translateX(-50%) translateY(0);
  }
`;

const PickBadge = styled.span`
  background-color: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
`;

const BarLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
`;

const BarOdds = styled.span`
  font-size: 13px;
  font-weight: 700;
  opacity: 0.85;
`;

const toDecimal = (american: number): number =>
  american > 0 ? (american / 100) + 1 : (100 / Math.abs(american)) + 1;

const toAmerican = (decimal: number): number =>
  decimal >= 2
    ? Math.round((decimal - 1) * 100)
    : Math.round(-100 / (decimal - 1));

interface ParlayBadgeProps {
  userId: string;
  userName: string;
}

const ParlayBadge: React.FC<ParlayBadgeProps> = ({ userId, userName }) => {
  const { legs } = useParlay();
  const [slipOpen, setSlipOpen] = useState(false);

  if (legs.length === 0) return null;

  // Calculate combined odds for display
  const rawDecimal = legs.reduce((acc, leg) => acc * toDecimal(leg.odds), 1);
  const reduction = legs.length >= 3 ? 0.30 : 0;
  const adjustedDecimal = 1 + (rawDecimal - 1) * (1 - reduction);
  const combinedOdds = toAmerican(adjustedDecimal);
  const oddsStr = combinedOdds > 0 ? `+${combinedOdds}` : `${combinedOdds}`;

  return (
    <>
      <Bar onClick={() => setSlipOpen(true)}>
        <PickBadge>{legs.length}</PickBadge>
        <BarLabel>{legs.length === 1 ? '1 Pick' : `${legs.length} Picks`}</BarLabel>
        <BarOdds>{oddsStr}</BarOdds>
      </Bar>

      {slipOpen && (
        <ParlaySlip
          userId={userId}
          userName={userName}
          onClose={() => setSlipOpen(false)}
        />
      )}
    </>
  );
};

export default ParlayBadge;

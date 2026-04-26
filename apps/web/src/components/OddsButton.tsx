import React from 'react';
import styled, { css } from 'styled-components';
import { colors } from '../styles/GlobalStyles';

interface OddsButtonProps {
  label: string;    // e.g. "KC -3.5"
  odds: number;     // e.g. -110
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  fullWidth?: boolean; // fill container width (used for specials stacked layout)
}

const formatOdds = (odds: number): string => {
  return odds > 0 ? `+${odds}` : `${odds}`;
};

const Button = styled.button<{ selected: boolean; fullWidth?: boolean }>`
  display: flex;
  flex-direction: ${({ fullWidth }) => fullWidth ? 'row' : 'column'};
  align-items: center;
  justify-content: ${({ fullWidth }) => fullWidth ? 'space-between' : 'center'};
  ${({ fullWidth }) => fullWidth ? 'width: 100%;' : 'flex: 1;'}
  padding: 8px ${({ fullWidth }) => fullWidth ? '12px' : '6px'};
  border-radius: 6px;
  border: 1px solid ${colors.border};
  background-color: ${colors.surfaceHover};
  transition: border-color 0.15s, background-color 0.15s;
  min-width: 0;

  ${({ selected }) =>
    selected &&
    css`
      background-color: ${colors.selected};
      border-color: ${colors.selectedBorder};
    `}

  &:hover:not(:disabled) {
    border-color: ${colors.accent};
    background-color: ${colors.selected};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const OddsLabel = styled.span`
  font-size: 11px;
  color: ${colors.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const OddsValue = styled.span<{ positive: boolean }>`
  font-size: 14px;
  font-weight: 700;
  color: ${({ positive }) => (positive ? colors.positive : colors.text)};
  margin-top: 2px;
  flex-shrink: 0;
`;

const OddsButton: React.FC<OddsButtonProps> = ({ label, odds, selected = false, onSelect, disabled, fullWidth }) => {
  const handleClick = () => {
    if (!disabled && onSelect) onSelect();
  };

  return (
    <Button selected={selected} onClick={handleClick} disabled={disabled} fullWidth={fullWidth}>
      <OddsLabel>{label}</OddsLabel>
      <OddsValue positive={odds > 0}>{formatOdds(odds)}</OddsValue>
    </Button>
  );
};

export default OddsButton;

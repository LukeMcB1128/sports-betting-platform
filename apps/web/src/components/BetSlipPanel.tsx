import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { colors } from '../styles/GlobalStyles';
import { BetType, BetSide } from '../types';
import { placeBet } from '../api/betsApi';

interface BetSlipPanelProps {
  gameId: string;
  betType: BetType;
  side: BetSide;
  label: string;
  odds: number;
  line?: number; // spread line at time of selection (spread bets only)
  maxStake?: number;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Panel = styled.div`
  margin-top: 8px;
  background-color: ${colors.bg};
  border: 1px solid ${colors.selectedBorder};
  border-radius: 8px;
  padding: 12px 14px;
  animation: ${slideDown} 0.15s ease;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const SelectedLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const OddsPill = styled.span<{ positive: boolean }>`
  font-size: 13px;
  font-weight: 700;
  color: ${({ positive }) => (positive ? colors.positive : colors.text)};
  background-color: ${colors.surfaceHover};
  border: 1px solid ${colors.border};
  border-radius: 4px;
  padding: 1px 6px;
`;

const MarketTag = styled.span`
  font-size: 10px;
  font-weight: 500;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CloseButton = styled.button`
  color: ${colors.textMuted};
  font-size: 18px;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.15s;

  &:hover {
    color: ${colors.text};
  }
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StakeWrapper = styled.div`
  position: relative;
  flex: 1;
`;

const DollarSign = styled.span`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: ${colors.textMuted};
  font-size: 14px;
  pointer-events: none;
`;

const StakeInput = styled.input`
  width: 100%;
  padding: 8px 10px 8px 22px;
  border-radius: 6px;
  border: 1px solid ${colors.border};
  background-color: ${colors.surfaceHover};
  color: ${colors.text};
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: ${colors.accent};
  }

  &::placeholder {
    color: ${colors.textMuted};
  }

  /* Remove number input arrows */
  -moz-appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
`;

const PayoutInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
`;

const PayoutItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const PayoutLabel = styled.span`
  font-size: 10px;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const PayoutValue = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: ${colors.text};
`;

const PlaceBetButton = styled.button<{ loading: boolean }>`
  width: 100%;
  margin-top: 10px;
  padding: 10px 16px;
  border-radius: 7px;
  background-color: ${({ loading }) => (loading ? colors.accentHover : colors.accent)};
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.2px;
  transition: background-color 0.15s;
  opacity: ${({ loading }) => (loading ? 0.7 : 1)};
  cursor: ${({ loading }) => (loading ? 'not-allowed' : 'pointer')};

  &:hover:not(:disabled) {
    background-color: ${colors.accentHover};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const ErrorMsg = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: ${colors.negative};
`;

const SuccessMsg = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: ${colors.positive};
  font-weight: 500;
`;

const MaxBetHint = styled.div`
  font-size: 11px;
  color: ${colors.textMuted};
  margin-bottom: 4px;
`;

const calcPayout = (stake: number, odds: number): number => {
  if (isNaN(stake) || stake <= 0) return 0;
  const profit = odds > 0
    ? stake * (odds / 100)
    : stake * (100 / Math.abs(odds));
  return parseFloat((stake + profit).toFixed(2));
};

const formatOdds = (odds: number): string => (odds > 0 ? `+${odds}` : `${odds}`);
const formatMoney = (n: number): string =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const BetSlipPanel: React.FC<BetSlipPanelProps> = ({
  gameId, betType, side, label, odds, line, maxStake, userName, onClose, onSuccess,
}) => {
  const [stakeStr, setStakeStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const stake = parseFloat(stakeStr);
  const validStake = !isNaN(stake) && stake > 0;
  const payout = validStake ? calcPayout(stake, odds) : 0;
  const profit = validStake ? parseFloat((payout - stake).toFixed(2)) : 0;

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setStakeStr(e.target.value);
  };

  const handleSubmit = async () => {
    if (!validStake) { setError('Enter a valid bet amount.'); return; }
    if (stake < 0.01) { setError('Minimum bet is $0.01.'); return; }
    if (maxStake && stake > maxStake) { setError(`Max bet for these odds is $${maxStake.toFixed(2)}`); return; }

    setLoading(true);
    setError(null);
    try {
      // cashAmount equals stake — the bet amount is what the user pays in cash
      await placeBet({ gameId, betType, side, label, odds, line, stake, cashAmount: stake, userName });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to place bet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel>
      <PanelHeader>
        <SelectedLabel>
          <MarketTag>{betType}</MarketTag>
          {label}
          <OddsPill positive={odds > 0}>{formatOdds(odds)}</OddsPill>
        </SelectedLabel>
        <CloseButton onClick={onClose} title="Remove selection">×</CloseButton>
      </PanelHeader>

      {maxStake !== undefined && (
        <MaxBetHint>Max bet: ${maxStake.toFixed(2)}</MaxBetHint>
      )}

      <InputRow>
        <StakeWrapper>
          <DollarSign>$</DollarSign>
          <StakeInput
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Bet amount"
            value={stakeStr}
            onChange={handleStakeChange}
            disabled={loading || success}
            autoFocus
          />
        </StakeWrapper>

        {validStake && (
          <PayoutInfo>
            <PayoutItem>
              <PayoutLabel>To Win</PayoutLabel>
              <PayoutValue>${formatMoney(profit)}</PayoutValue>
            </PayoutItem>
            <PayoutItem>
              <PayoutLabel>Payout</PayoutLabel>
              <PayoutValue>${formatMoney(payout)}</PayoutValue>
            </PayoutItem>
          </PayoutInfo>
        )}
      </InputRow>

      {error && <ErrorMsg>{error}</ErrorMsg>}
      {success && <SuccessMsg>Bet submitted! Hand over your cash and it will be confirmed shortly.</SuccessMsg>}

      <PlaceBetButton
        onClick={handleSubmit}
        disabled={!validStake || loading || success}
        loading={loading}
      >
        {loading ? 'Submitting…' : success ? 'Submitted!' : 'Submit Bet'}
      </PlaceBetButton>
    </Panel>
  );
};

export default BetSlipPanel;

import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { colors } from '../styles/GlobalStyles';
import { useParlay } from '../context/ParlayContext';
import { placeParlay } from '../api/parlaysApi';

// ─── Odds math ────────────────────────────────────────────────────────────────

const toDecimal = (american: number): number =>
  american > 0 ? (american / 100) + 1 : (100 / Math.abs(american)) + 1;

const toAmerican = (decimal: number): number =>
  decimal >= 2
    ? Math.round((decimal - 1) * 100)
    : Math.round(-100 / (decimal - 1));

const calcCombinedOdds = (legs: { odds: number }[]): number => {
  if (legs.length === 0) return 0;
  const rawDecimal = legs.reduce((acc, leg) => acc * toDecimal(leg.odds), 1);
  // House edge: 40% profit reduction for 3+ legs
  const reduction = legs.length >= 3 ? 0.40 : 0;
  const adjustedDecimal = 1 + (rawDecimal - 1) * (1 - reduction);
  return toAmerican(adjustedDecimal);
};

const calcPayout = (stake: number, combinedOdds: number): number => {
  const decimal = toDecimal(combinedOdds);
  return parseFloat((stake * decimal).toFixed(2));
};

const formatOdds = (n: number) => (n > 0 ? `+${n}` : `${n}`);
const formatMoney = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Styled components ────────────────────────────────────────────────────────

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 300;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 0 0 0;
`;

const Sheet = styled.div`
  background-color: ${colors.surface};
  border: 1px solid ${colors.border};
  border-bottom: none;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: ${slideUp} 0.2s ease;
`;

const SheetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 14px;
  border-bottom: 1px solid ${colors.border};
  flex-shrink: 0;
`;

const SheetTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: ${colors.text};
`;

const PickCount = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${colors.textMuted};
  background-color: ${colors.surfaceHover};
  border: 1px solid ${colors.border};
  border-radius: 12px;
  padding: 2px 8px;
  margin-left: 8px;
`;

const CloseButton = styled.button`
  color: ${colors.textMuted};
  font-size: 20px;
  line-height: 1;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.15s;
  &:hover { color: ${colors.text}; }
`;

const LegList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LegCard = styled.div`
  background-color: ${colors.surfaceHover};
  border: 1px solid ${colors.border};
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LegInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const LegLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LegMeta = styled.div`
  font-size: 11px;
  color: ${colors.textMuted};
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const LegOdds = styled.div<{ positive: boolean }>`
  font-size: 14px;
  font-weight: 700;
  color: ${({ positive }) => (positive ? colors.positive : colors.text)};
  flex-shrink: 0;
`;

const RemoveLeg = styled.button`
  color: ${colors.textMuted};
  font-size: 16px;
  line-height: 1;
  padding: 2px 4px;
  flex-shrink: 0;
  border-radius: 4px;
  transition: color 0.15s;
  &:hover { color: ${colors.negative}; }
`;

const Footer = styled.div`
  padding: 14px 16px;
  border-top: 1px solid ${colors.border};
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
`;

const OddsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const OddsLabel = styled.span`
  font-size: 12px;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const CombinedOdds = styled.span<{ positive: boolean }>`
  font-size: 20px;
  font-weight: 700;
  color: ${({ positive }) => (positive ? colors.positive : colors.text)};
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
  padding: 9px 10px 9px 22px;
  border-radius: 7px;
  border: 1px solid ${colors.border};
  background-color: ${colors.surfaceHover};
  color: ${colors.text};
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;

  &:focus { border-color: ${colors.accent}; }
  &::placeholder { color: ${colors.textMuted}; }
  -moz-appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button { -webkit-appearance: none; }
`;

const PayoutPreview = styled.div`
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
  font-size: 16px;
  font-weight: 700;
  color: ${colors.positive};
`;

const SubmitButton = styled.button<{ loading?: boolean }>`
  width: 100%;
  padding: 11px 16px;
  border-radius: 8px;
  background-color: ${({ loading }) => (loading ? colors.accentHover : colors.accent)};
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.2px;
  transition: background-color 0.15s;
  opacity: ${({ loading }) => (loading ? 0.7 : 1)};

  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:hover:not(:disabled) { background-color: ${colors.accentHover}; }
`;

const ErrorMsg = styled.div`
  font-size: 12px;
  color: ${colors.negative};
`;

const SuccessMsg = styled.div`
  font-size: 12px;
  color: ${colors.positive};
  font-weight: 500;
`;

const MinLegsHint = styled.div`
  font-size: 12px;
  color: ${colors.textMuted};
  text-align: center;
  padding: 8px 0;
`;

// ─── Component ────────────────────────────────────────────────────────────────

interface ParlaySlipProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

const ParlaySlip: React.FC<ParlaySlipProps> = ({ userId, userName, onClose }) => {
  const { legs, removeLeg, clearLegs } = useParlay();
  const [stakeStr, setStakeStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const combinedOdds = calcCombinedOdds(legs);
  const stake = parseFloat(stakeStr);
  const validStake = !isNaN(stake) && stake > 0;
  const payout = validStake ? calcPayout(stake, combinedOdds) : 0;
  const profit = validStake ? parseFloat((payout - stake).toFixed(2)) : 0;

  const handleSubmit = async () => {
    if (legs.length < 2) { setError('Add at least 2 picks to submit a parlay.'); return; }
    if (!validStake) { setError('Enter a valid stake amount.'); return; }
    if (stake < 0.01) { setError('Minimum bet is $0.01.'); return; }

    setLoading(true);
    setError(null);
    try {
      await placeParlay({
        legs,
        combinedOdds,
        stake,
        cashAmount: stake,
        userId,
        userName,
      });
      setSuccess(true);
      setTimeout(() => {
        clearLegs();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to place parlay.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Sheet onClick={(e) => e.stopPropagation()}>
        <SheetHeader>
          <SheetTitle>
            My Picks
            <PickCount>{legs.length} {legs.length === 1 ? 'pick' : 'picks'}</PickCount>
          </SheetTitle>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </SheetHeader>

        <LegList>
          {legs.length === 0 && (
            <MinLegsHint>No picks yet — add picks from the games list.</MinLegsHint>
          )}
          {legs.map((leg, i) => (
            <LegCard key={`${leg.gameId}-${leg.betType}-${leg.side}-${i}`}>
              <LegInfo>
                <LegLabel>{leg.label}</LegLabel>
                <LegMeta>{leg.betType}</LegMeta>
              </LegInfo>
              <LegOdds positive={leg.odds > 0}>{formatOdds(leg.odds)}</LegOdds>
              <RemoveLeg
                onClick={() => removeLeg(leg.gameId, leg.betType, leg.side)}
                title="Remove pick"
              >
                ×
              </RemoveLeg>
            </LegCard>
          ))}
        </LegList>

        <Footer>
          {legs.length >= 2 && (
            <>
              <OddsRow>
                <OddsLabel>Combined odds</OddsLabel>
                <CombinedOdds positive={combinedOdds > 0}>
                  {formatOdds(combinedOdds)}
                </CombinedOdds>
              </OddsRow>

              <InputRow>
                <StakeWrapper>
                  <DollarSign>$</DollarSign>
                  <StakeInput
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={stakeStr}
                    onChange={(e) => { setStakeStr(e.target.value); setError(null); }}
                    disabled={loading || success}
                    autoFocus
                  />
                </StakeWrapper>
                {validStake && (
                  <PayoutPreview>
                    <PayoutLabel>To win</PayoutLabel>
                    <PayoutValue>+${formatMoney(profit)}</PayoutValue>
                  </PayoutPreview>
                )}
              </InputRow>

              {error && <ErrorMsg>{error}</ErrorMsg>}
              {success && <SuccessMsg>Parlay submitted! Hand over your cash to confirm.</SuccessMsg>}

              <SubmitButton
                onClick={handleSubmit}
                disabled={!validStake || loading || success}
                loading={loading}
              >
                {loading ? 'Submitting…' : success ? 'Submitted!' : `Submit ${legs.length}-Leg Parlay`}
              </SubmitButton>
            </>
          )}

          {legs.length === 1 && (
            <MinLegsHint>Add 1 more pick to submit a parlay.</MinLegsHint>
          )}
        </Footer>
      </Sheet>
    </Overlay>
  );
};

export default ParlaySlip;

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Game, GameOdds, BetLimits, LockedSides, SetLinesFormData, Special } from '../types';
import { colors } from '../styles/GlobalStyles';
import Button from './Button';
import FormField, { Input } from './FormField';
import { verifyAdminPassword } from '../api/adminApi';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdvancedGameModalProps {
  game: Game;
  adminToken: string;
  onClose: () => void;
  onSaveLines: (gameId: string, odds: GameOdds) => void;
  onSaveBetLimits: (gameId: string, betLimits: BetLimits) => void;
  onUpdateLockedSides: (gameId: string, lockedSides: LockedSides) => void;
  onUpdateSpecials: (gameId: string, specials: Special[]) => void;
  onVoidAllBets: (gameId: string) => void;
  onRemove: (gameId: string) => void;
}

interface Bet {
  id: string;
  gameId: string;
  betType: string;
  side: string;
  payout: number;
  status: string;
}

interface ParlayLeg {
  gameId: string;
  side: string;
}

interface Parlay {
  id: string;
  legs: ParlayLeg[];
  payout: number;
  status: string;
}

// ── Styled components ─────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
`;

const Dialog = styled.div`
  background-color: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: 12px;
  width: 100%;
  max-width: 620px;
  max-height: 90vh;
  overflow-y: auto;
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid ${colors.border};
  position: sticky;
  top: 0;
  background-color: ${colors.surface};
  z-index: 1;
`;

const DialogTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text};
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

const DialogBody = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const SectionTitle = styled.p`
  font-size: 11px;
  font-weight: 600;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: -8px;
`;

const Divider = styled.div`
  height: 1px;
  background-color: ${colors.border};
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const HintText = styled.p`
  font-size: 11px;
  color: ${colors.textMuted};
  margin-top: -10px;
`;

const MaxStakeHint = styled.p`
  font-size: 11px;
  color: ${colors.textMuted};
  margin-top: 4px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
`;

const SectionBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const DangerSection = styled.div`
  border: 1px solid rgba(239, 68, 68, 0.10);
  border-radius: 8px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const DangerHeader = styled.p`
  font-size: 11px;
  font-weight: 600;
  color: ${colors.danger};
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

const DangerDesc = styled.p`
  font-size: 12px;
  color: ${colors.textMuted};
`;

const LockBadge = styled.span<{ locked: boolean }>`
  display: inline-block;
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  background-color: ${({ locked }) => locked ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'};
  color: ${({ locked }) => locked ? colors.danger : colors.success};
  border: 1px solid ${({ locked }) => locked ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'};
  margin-left: 8px;
`;

const LockRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
`;

const LockLabel = styled.span`
  font-size: 13px;
  color: ${colors.text};
  display: flex;
  align-items: center;
  gap: 0;
`;

const LiabilityRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const LiabilityLine = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: ${colors.textMuted};
`;

const LiabilityTotal = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: ${colors.text};
  padding-top: 4px;
  border-top: 1px solid ${colors.border};
`;

const InlineConfirm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background-color: ${colors.surfaceHover};
  border-radius: 8px;
  border: 1px solid ${colors.border};
`;

const InlineConfirmText = styled.p`
  font-size: 13px;
  color: ${colors.text};
`;

const InlineConfirmButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const ErrorMsg = styled.p`
  font-size: 12px;
  color: ${colors.danger};
`;

const SuccessMsg = styled.p`
  font-size: 12px;
  color: ${colors.success};
`;

const OddsHint = styled.p`
  font-size: 12px;
  color: ${colors.textMuted};
  margin-bottom: 4px;
`;

const SpecialRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background-color: ${colors.surfaceHover};
  border: 1px solid ${colors.border};
  border-radius: 8px;
`;

const SpecialInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SpecialQuestion = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${colors.text};
  margin-bottom: 3px;
`;

const SpecialOdds = styled.div`
  font-size: 11px;
  color: ${colors.textMuted};
`;

const SpecialActions = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

const SmallButton = styled.button<{ variant?: 'edit' | 'remove' }>`
  padding: 3px 9px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s, opacity 0.15s;
  white-space: nowrap;

  color: ${({ variant }) => variant === 'remove' ? colors.danger : colors.textMuted};
  border: 1px solid ${({ variant }) => variant === 'remove' ? `${colors.danger}60` : colors.border};
  background-color: transparent;

  &:hover {
    background-color: ${({ variant }) => variant === 'remove' ? `${colors.danger}18` : colors.surfaceHover};
  }
`;

const SpecialForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background-color: ${colors.surfaceHover};
  border: 1px solid ${colors.border};
  border-radius: 8px;
`;

const SpecialFormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const toStr = (n: number): string => (n > 0 ? `+${n}` : String(n));
const formatOdds = (n: number) => (n > 0 ? `+${n}` : `${n}`);

const parseOdds = (val: string): number | null => {
  const n = parseInt(val.replace(/\s/g, ''), 10);
  return isNaN(n) ? null : n;
};

const parseSpreadLine = (val: string): number | null => {
  const n = parseFloat(val.replace(/\s/g, ''));
  return isNaN(n) ? null : n;
};

const validateOddsField = (val: string, label: string): string | undefined => {
  const n = parseOdds(val);
  if (n === null) return `${label} must be a number (e.g. -110 or +130)`;
  if (n === 0) return `${label} cannot be 0`;
  return undefined;
};

const validateLineField = (val: string, label: string): string | undefined => {
  const n = parseSpreadLine(val);
  if (n === null) return `${label} must be a number (e.g. -1.5, +0.5)`;
  if (n === 0) return `${label} cannot be 0`;
  return undefined;
};

type LinesErrors = Partial<Record<keyof SetLinesFormData, string>>;

const validateLines = (f: SetLinesFormData): LinesErrors => ({
  mlHome:          validateOddsField(f.mlHome, 'Home ML'),
  mlAway:          validateOddsField(f.mlAway, 'Away ML'),
  spreadHomeLine:  validateLineField(f.spreadHomeLine, 'Home line'),
  spreadHomeJuice: validateOddsField(f.spreadHomeJuice, 'Home juice'),
  spreadAwayLine:  validateLineField(f.spreadAwayLine, 'Away line'),
  spreadAwayJuice: validateOddsField(f.spreadAwayJuice, 'Away juice'),
});

const calcMaxStake = (odds: number, maxPayout: number): number => {
  const decimal = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
  return parseFloat((maxPayout / decimal).toFixed(2));
};

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3002';

// ── Component ─────────────────────────────────────────────────────────────────

const AdvancedGameModal: React.FC<AdvancedGameModalProps> = ({
  game,
  adminToken,
  onClose,
  onSaveLines,
  onSaveBetLimits,
  onUpdateLockedSides,
  onUpdateSpecials,
  onVoidAllBets,
  onRemove,
}) => {

  // ── Section 1: Set Lines ───────────────────────────────────────────────────

  const [linesForm, setLinesForm] = useState<SetLinesFormData>({
    mlHome: game.odds?.moneyline ? toStr(game.odds.moneyline.home) : '',
    mlAway: game.odds?.moneyline ? toStr(game.odds.moneyline.away) : '',
    spreadHomeLine: game.odds?.spread ? toStr(game.odds.spread.home.line) : '',
    spreadHomeJuice: game.odds?.spread ? toStr(game.odds.spread.home.juice) : '',
    spreadAwayLine: game.odds?.spread ? toStr(game.odds.spread.away.line) : '',
    spreadAwayJuice: game.odds?.spread ? toStr(game.odds.spread.away.juice) : '',
  });
  const [linesErrors, setLinesErrors] = useState<LinesErrors>({});
  const [linesSaved, setLinesSaved] = useState(false);

  const setLinesField = (field: keyof SetLinesFormData, value: string) => {
    setLinesForm((prev) => ({ ...prev, [field]: value }));
    setLinesErrors((prev) => ({ ...prev, [field]: undefined }));
    setLinesSaved(false);
  };

  const handleSaveLines = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateLines(linesForm);
    const hasErrors = Object.values(errs).some(Boolean);
    if (hasErrors) {
      setLinesErrors(errs);
      return;
    }
    const odds: GameOdds = {
      moneyline: {
        home: parseOdds(linesForm.mlHome)!,
        away: parseOdds(linesForm.mlAway)!,
      },
      spread: {
        home: {
          line: parseSpreadLine(linesForm.spreadHomeLine)!,
          juice: parseOdds(linesForm.spreadHomeJuice)!,
        },
        away: {
          line: parseSpreadLine(linesForm.spreadAwayLine)!,
          juice: parseOdds(linesForm.spreadAwayJuice)!,
        },
      },
    };
    onSaveLines(game.id, odds);
    setLinesSaved(true);
  };

  // ── Section 2: Bet Limits ─────────────────────────────────────────────────

  const DEFAULT_MAX_PAYOUT = 1000;
  const DEFAULT_MAX_STAKE  = 500;

  const [awayMaxPayout, setAwayMaxPayout] = useState<number>(
    game.betLimits?.away.maxPayout ?? DEFAULT_MAX_PAYOUT
  );
  const [homeMaxPayout, setHomeMaxPayout] = useState<number>(
    game.betLimits?.home.maxPayout ?? DEFAULT_MAX_PAYOUT
  );
  const [awayMaxStake, setAwayMaxStake] = useState<number>(
    game.betLimits?.away.maxStake ?? DEFAULT_MAX_STAKE
  );
  const [homeMaxStake, setHomeMaxStake] = useState<number>(
    game.betLimits?.home.maxStake ?? DEFAULT_MAX_STAKE
  );
  const [limitsSaved, setLimitsSaved] = useState(false);

  const awayOdds = game.odds?.moneyline?.away ?? 0;
  const homeOdds = game.odds?.moneyline?.home ?? 0;

  const handleSaveBetLimits = () => {
    const betLimits: BetLimits = {
      away: { maxStake: awayMaxStake, maxPayout: awayMaxPayout },
      home: { maxStake: homeMaxStake, maxPayout: homeMaxPayout },
    };
    onSaveBetLimits(game.id, betLimits);
    setLimitsSaved(true);
  };

  // ── Section 3: Lock Sides ─────────────────────────────────────────────────

  const [lockedSides, setLockedSides] = useState<LockedSides>(
    game.lockedSides ?? { home: false, away: false }
  );

  const toggleLock = (side: 'home' | 'away') => {
    const newLocked: LockedSides = {
      ...lockedSides,
      [side]: !lockedSides[side],
    };
    setLockedSides(newLocked);
    onUpdateLockedSides(game.id, newLocked);
  };

  // ── Section 4: Specials ───────────────────────────────────────────────────

  const [specials, setSpecials] = useState<Special[]>(game.specials ?? []);
  // Form state — used for both Add and Edit
  const [editingSpecialId, setEditingSpecialId] = useState<string | null>(null); // null = adding new
  const [showSpecialForm, setShowSpecialForm] = useState(false);
  const [spQuestion, setSpQuestion] = useState('');
  const [spYesOdds, setSpYesOdds] = useState('');
  const [spNoOdds, setSpNoOdds] = useState('');
  const [spError, setSpError] = useState<string | null>(null);

  const openAddSpecial = () => {
    setEditingSpecialId(null);
    setSpQuestion('');
    setSpYesOdds('');
    setSpNoOdds('');
    setSpError(null);
    setShowSpecialForm(true);
  };

  const openEditSpecial = (sp: Special) => {
    setEditingSpecialId(sp.id);
    setSpQuestion(sp.question);
    setSpYesOdds(toStr(sp.yesOdds));
    setSpNoOdds(toStr(sp.noOdds));
    setSpError(null);
    setShowSpecialForm(true);
  };

  const cancelSpecialForm = () => {
    setShowSpecialForm(false);
    setEditingSpecialId(null);
    setSpError(null);
  };

  const handleSaveSpecial = () => {
    if (!spQuestion.trim()) { setSpError('Question is required.'); return; }
    const yesNum = parseOdds(spYesOdds);
    const noNum  = parseOdds(spNoOdds);
    if (yesNum === null || yesNum === 0) { setSpError('Yes Odds must be a valid American odds number.'); return; }
    if (noNum  === null || noNum  === 0) { setSpError('No Odds must be a valid American odds number.'); return; }

    let updated: Special[];
    if (editingSpecialId) {
      updated = specials.map((s) =>
        s.id === editingSpecialId
          ? { ...s, question: spQuestion.trim(), yesOdds: yesNum, noOdds: noNum }
          : s
      );
    } else {
      const newSpecial: Special = {
        id: Date.now().toString(),
        question: spQuestion.trim(),
        yesOdds: yesNum,
        noOdds: noNum,
      };
      updated = [...specials, newSpecial];
    }

    setSpecials(updated);
    onUpdateSpecials(game.id, updated);
    setShowSpecialForm(false);
    setEditingSpecialId(null);
    setSpError(null);
  };

  const handleRemoveSpecial = (id: string) => {
    const updated = specials.filter((s) => s.id !== id);
    setSpecials(updated);
    onUpdateSpecials(game.id, updated);
  };

  // ── Section 5: Game Liability ─────────────────────────────────────────────

  const [liability, setLiability] = useState<{ away: number; home: number; special: number; parlay: number } | null>(null);
  const [liabilityLoading, setLiabilityLoading] = useState(true);

  const fetchLiability = async () => {
    setLiabilityLoading(true);
    try {
      const [betsRes, parlaysRes] = await Promise.all([
        fetch(`${API_BASE}/bets`, { headers: { 'X-Admin-Token': adminToken } }),
        fetch(`${API_BASE}/parlays`, { headers: { 'X-Admin-Token': adminToken } }),
      ]);
      const allBets: Bet[] = await betsRes.json();
      const allParlays: Parlay[] = await parlaysRes.json();

      const gameBets = allBets.filter(
        (b) => b.gameId === game.id && (b.status === 'pending' || b.status === 'awaiting_payment')
      );
      const awayExposure = gameBets
        .filter((b) => b.betType !== 'special' && b.side === 'away')
        .reduce((sum, b) => sum + b.payout, 0);
      const homeExposure = gameBets
        .filter((b) => b.betType !== 'special' && b.side === 'home')
        .reduce((sum, b) => sum + b.payout, 0);
      const specialExposure = gameBets
        .filter((b) => b.betType === 'special')
        .reduce((sum, b) => sum + b.payout, 0);

      const activeParlays = allParlays.filter(
        (p) => (p.status === 'pending' || p.status === 'awaiting_payment') &&
          p.legs.some((l) => l.gameId === game.id)
      );
      const parlayExposure = activeParlays.reduce((sum, p) => sum + p.payout, 0);

      setLiability({ away: awayExposure, home: homeExposure, special: specialExposure, parlay: parlayExposure });
    } catch {
      setLiability({ away: 0, home: 0, special: 0, parlay: 0 });
    } finally {
      setLiabilityLoading(false);
    }
  };

  useEffect(() => {
    fetchLiability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Section 6: Void All Bets ──────────────────────────────────────────────

  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [voidPendingCount, setVoidPendingCount] = useState<number | null>(null);

  useEffect(() => {
    if (!liabilityLoading && liability !== null) {
      fetch(`${API_BASE}/bets`, { headers: { 'X-Admin-Token': adminToken } })
        .then((r) => r.json())
        .then((allBets: Bet[]) => {
          const count = allBets.filter(
            (b) => b.gameId === game.id && (b.status === 'pending' || b.status === 'awaiting_payment')
          ).length;
          setVoidPendingCount(count);
        })
        .catch(() => setVoidPendingCount(0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liabilityLoading]);

  const handleConfirmVoid = () => {
    onVoidAllBets(game.id);
    setShowVoidConfirm(false);
    // Refresh liability
    fetchLiability();
  };

  // ── Section 7: Remove Game ────────────────────────────────────────────────

  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removePassword, setRemovePassword] = useState('');
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const handleConfirmRemove = async (e: React.FormEvent) => {
    e.preventDefault();
    setRemoveError(null);
    setRemoveLoading(true);
    try {
      await verifyAdminPassword(removePassword, adminToken);
      onRemove(game.id);
      onClose();
    } catch (err: unknown) {
      setRemoveError(err instanceof Error ? err.message : 'Incorrect password');
    } finally {
      setRemoveLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const totalLiability = liability ? liability.away + liability.home + liability.special + liability.parlay : 0;

  return (
    <Overlay onClick={onClose}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>
            Advanced — {game.awayTeam} @ {game.homeTeam}
          </DialogTitle>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </DialogHeader>

        <DialogBody>

          {/* ── Section 1: Set Lines ──────────────────────────────────────── */}
          <SectionBlock>
            <SectionTitle>Set Lines</SectionTitle>
            <HintText>Use American odds format: -110, +130, -3.5, etc.</HintText>

            <form onSubmit={handleSaveLines}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Moneyline
                </p>
                <Row>
                  <FormField label={`Away — ${game.awayTeam}`} error={linesErrors.mlAway}>
                    <Input
                      value={linesForm.mlAway}
                      onChange={(e) => setLinesField('mlAway', e.target.value)}
                    />
                  </FormField>
                  <FormField label={`Home — ${game.homeTeam}`} error={linesErrors.mlHome}>
                    <Input
                      value={linesForm.mlHome}
                      onChange={(e) => setLinesField('mlHome', e.target.value)}
                    />
                  </FormField>
                </Row>

                <Divider />

                <p style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Spread
                </p>
                <Row>
                  <FormField label={`Away Line — ${game.awayTeam}`} error={linesErrors.spreadAwayLine}>
                    <Input
                      value={linesForm.spreadAwayLine}
                      onChange={(e) => setLinesField('spreadAwayLine', e.target.value)}
                    />
                  </FormField>
                  <FormField label="Away Juice" error={linesErrors.spreadAwayJuice}>
                    <Input
                      placeholder="-110"
                      value={linesForm.spreadAwayJuice}
                      onChange={(e) => setLinesField('spreadAwayJuice', e.target.value)}
                    />
                  </FormField>
                </Row>
                <Row>
                  <FormField label={`Home Line — ${game.homeTeam}`} error={linesErrors.spreadHomeLine}>
                    <Input
                      value={linesForm.spreadHomeLine}
                      onChange={(e) => setLinesField('spreadHomeLine', e.target.value)}
                    />
                  </FormField>
                  <FormField label="Home Juice" error={linesErrors.spreadHomeJuice}>
                    <Input
                      placeholder="-110"
                      value={linesForm.spreadHomeJuice}
                      onChange={(e) => setLinesField('spreadHomeJuice', e.target.value)}
                    />
                  </FormField>
                </Row>

                <Actions>
                  {linesSaved && <SuccessMsg>Lines saved.</SuccessMsg>}
                  <Button type="submit" variant="primary" size="sm">Save Lines</Button>
                </Actions>
              </div>
            </form>
          </SectionBlock>

          <Divider />

          {/* ── Section 2: Bet Limits ─────────────────────────────────────── */}
          <SectionBlock>
            <SectionTitle>Bet Limits</SectionTitle>
            <Row>
              {/* Away */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <OddsHint>Away — {game.awayTeam} ({formatOdds(awayOdds)})</OddsHint>
                <FormField label="Max Stake ($)">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={awayMaxStake}
                    onChange={(e) => {
                      setAwayMaxStake(parseFloat(e.target.value) || 0);
                      setLimitsSaved(false);
                    }}
                  />
                </FormField>
                <FormField label="Max Payout ($)">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={awayMaxPayout}
                    onChange={(e) => {
                      setAwayMaxPayout(parseFloat(e.target.value) || 0);
                      setLimitsSaved(false);
                    }}
                  />
                </FormField>
              </div>

              {/* Home */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <OddsHint>Home — {game.homeTeam} ({formatOdds(homeOdds)})</OddsHint>
                <FormField label="Max Stake ($)">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={homeMaxStake}
                    onChange={(e) => {
                      setHomeMaxStake(parseFloat(e.target.value) || 0);
                      setLimitsSaved(false);
                    }}
                  />
                </FormField>
                <FormField label="Max Payout ($)">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={homeMaxPayout}
                    onChange={(e) => {
                      setHomeMaxPayout(parseFloat(e.target.value) || 0);
                      setLimitsSaved(false);
                    }}
                  />
                </FormField>
              </div>
            </Row>
            <Actions>
              {limitsSaved && <SuccessMsg>Limits saved.</SuccessMsg>}
              <Button type="button" variant="primary" size="sm" onClick={handleSaveBetLimits}>
                Save Limits
              </Button>
            </Actions>
          </SectionBlock>

          <Divider />

          {/* ── Section 3: Lock a Side ────────────────────────────────────── */}
          <SectionBlock>
            <SectionTitle>Lock a Side</SectionTitle>

            <LockRow>
              <LockLabel>
                Away — {game.awayTeam}
                <LockBadge locked={lockedSides.away}>
                  {lockedSides.away ? 'Locked' : 'Open'}
                </LockBadge>
              </LockLabel>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toggleLock('away')}
              >
                {lockedSides.away ? 'Unlock Away Side' : 'Lock Away Side'}
              </Button>
            </LockRow>

            <LockRow>
              <LockLabel>
                Home — {game.homeTeam}
                <LockBadge locked={lockedSides.home}>
                  {lockedSides.home ? 'Locked' : 'Open'}
                </LockBadge>
              </LockLabel>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toggleLock('home')}
              >
                {lockedSides.home ? 'Unlock Home Side' : 'Lock Home Side'}
              </Button>
            </LockRow>
          </SectionBlock>

          <Divider />

          {/* ── Section 4: Specials ───────────────────────────────────────── */}
          <SectionBlock>
            <SectionTitle>Specials</SectionTitle>

            {specials.length === 0 && !showSpecialForm && (
              <HintText>No specials added yet.</HintText>
            )}

            {specials.map((sp) => (
              <SpecialRow key={sp.id}>
                <SpecialInfo>
                  <SpecialQuestion>{sp.question}</SpecialQuestion>
                  <SpecialOdds>
                    YES {sp.yesOdds > 0 ? `+${sp.yesOdds}` : sp.yesOdds}
                    {'  ·  '}
                    NO {sp.noOdds > 0 ? `+${sp.noOdds}` : sp.noOdds}
                  </SpecialOdds>
                </SpecialInfo>
                <SpecialActions>
                  <SmallButton onClick={() => openEditSpecial(sp)}>Edit</SmallButton>
                  <SmallButton variant="remove" onClick={() => handleRemoveSpecial(sp.id)}>✕</SmallButton>
                </SpecialActions>
              </SpecialRow>
            ))}

            {showSpecialForm && (
              <SpecialForm>
                <FormField label="Question (e.g. Paul KOs James first round)">
                  <Input
                    value={spQuestion}
                    onChange={(e) => { setSpQuestion(e.target.value); setSpError(null); }}
                    placeholder="Enter proposition question"
                    autoFocus
                  />
                </FormField>
                <SpecialFormRow>
                  <FormField label="Yes Odds (e.g. +200)">
                    <Input
                      value={spYesOdds}
                      onChange={(e) => { setSpYesOdds(e.target.value); setSpError(null); }}
                      placeholder="+200"
                    />
                  </FormField>
                  <FormField label="No Odds (e.g. -250)">
                    <Input
                      value={spNoOdds}
                      onChange={(e) => { setSpNoOdds(e.target.value); setSpError(null); }}
                      placeholder="-250"
                    />
                  </FormField>
                </SpecialFormRow>
                {spError && <ErrorMsg>{spError}</ErrorMsg>}
                <Actions>
                  <Button type="button" variant="ghost" size="sm" onClick={cancelSpecialForm}>Cancel</Button>
                  <Button type="button" variant="primary" size="sm" onClick={handleSaveSpecial}>
                    {editingSpecialId ? 'Save Changes' : 'Add Special'}
                  </Button>
                </Actions>
              </SpecialForm>
            )}

            {!showSpecialForm && (
              <div>
                <Button type="button" variant="ghost" size="sm" onClick={openAddSpecial}>
                  + Add Special
                </Button>
              </div>
            )}
          </SectionBlock>

          <Divider />

          {/* ── Section 5: Game Liability ─────────────────────────────────── */}
          <SectionBlock>
            <SectionTitle>Game Liability</SectionTitle>
            {liabilityLoading ? (
              <HintText>Calculating...</HintText>
            ) : liability ? (
              <LiabilityRow>
                <LiabilityLine>
                  <span>Away exposure ({game.awayTeam})</span>
                  <span>${liability.away.toFixed(2)}</span>
                </LiabilityLine>
                <LiabilityLine>
                  <span>Home exposure ({game.homeTeam})</span>
                  <span>${liability.home.toFixed(2)}</span>
                </LiabilityLine>
                {liability.special > 0 && (
                  <LiabilityLine>
                    <span>Specials exposure</span>
                    <span>${liability.special.toFixed(2)}</span>
                  </LiabilityLine>
                )}
                {liability.parlay > 0 && (
                  <LiabilityLine>
                    <span>Parlay exposure</span>
                    <span>${liability.parlay.toFixed(2)}</span>
                  </LiabilityLine>
                )}
                <LiabilityTotal>
                  <span>Total</span>
                  <span>${totalLiability.toFixed(2)}</span>
                </LiabilityTotal>
              </LiabilityRow>
            ) : null}
          </SectionBlock>

          <Divider />

          {/* ── Section 6: Void All Bets ──────────────────────────────────── */}
          <SectionBlock>
            <SectionTitle>Void All Bets</SectionTitle>

            {!showVoidConfirm ? (
              <div>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setShowVoidConfirm(true)}
                >
                  Void All Pending Bets
                </Button>
              </div>
            ) : (
              <InlineConfirm>
                <InlineConfirmText>
                  This will void and refund all {voidPendingCount ?? '...'} pending bet(s) for this game.
                </InlineConfirmText>
                <InlineConfirmButtons>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowVoidConfirm(false)}>
                    Cancel
                  </Button>
                  <Button type="button" variant="danger" size="sm" onClick={handleConfirmVoid}>
                    Confirm Void
                  </Button>
                </InlineConfirmButtons>
              </InlineConfirm>
            )}
          </SectionBlock>

          <Divider />

          {/* ── Section 7: Remove Game ────────────────────────────────────── */}
          <DangerSection>
            <DangerHeader>Danger Zone</DangerHeader>
            <DangerDesc>
              Permanently removes this game and voids all associated bets. Cannot be undone.
            </DangerDesc>

            {!showRemoveConfirm ? (
              <div>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setShowRemoveConfirm(true)}
                >
                  Remove Game
                </Button>
              </div>
            ) : (
              <InlineConfirm>
                <form onSubmit={handleConfirmRemove} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <FormField label="Enter admin password to confirm" error={removeError ?? undefined}>
                    <Input
                      type="password"
                      placeholder="Password"
                      value={removePassword}
                      onChange={(e) => {
                        setRemovePassword(e.target.value);
                        setRemoveError(null);
                      }}
                      autoFocus
                    />
                  </FormField>
                  {removeError && <ErrorMsg>{removeError}</ErrorMsg>}
                  <InlineConfirmButtons>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowRemoveConfirm(false);
                        setRemovePassword('');
                        setRemoveError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="danger"
                      size="sm"
                      disabled={removeLoading || !removePassword}
                    >
                      {removeLoading ? 'Verifying…' : 'Confirm Delete'}
                    </Button>
                  </InlineConfirmButtons>
                </form>
              </InlineConfirm>
            )}
          </DangerSection>

        </DialogBody>
      </Dialog>
    </Overlay>
  );
};

export default AdvancedGameModal;

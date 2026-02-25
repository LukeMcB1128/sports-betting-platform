import React, { useState } from 'react';
import styled from 'styled-components';
import { Game, SetLinesFormData, GameOdds } from '../types';
import { colors } from '../styles/GlobalStyles';
import Modal from './Modal';
import FormField, { Input } from './FormField';
import Button from './Button';

interface SetLinesModalProps {
  game: Game;
  onClose: () => void;
  onSave: (gameId: string, odds: GameOdds) => void;
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const SectionLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: -6px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const Divider = styled.div`
  height: 1px;
  background-color: ${colors.border};
`;

const HintText = styled.p`
  font-size: 11px;
  color: ${colors.textMuted};
  margin-top: -10px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
`;

type Errors = Partial<Record<keyof SetLinesFormData, string>>;

const toStr = (n: number): string => (n > 0 ? `+${n}` : String(n));

const parseOdds = (val: string): number | null => {
  const n = parseInt(val.replace(/\s/g, ''), 10);
  return isNaN(n) ? null : n;
};

const validateOddsField = (val: string, label: string): string | undefined => {
  const n = parseOdds(val);
  if (n === null) return `${label} must be a number (e.g. -110 or +130)`;
  if (n === 0) return `${label} cannot be 0`;
  return undefined;
};

const validate = (f: SetLinesFormData): Errors => ({
  mlHome: validateOddsField(f.mlHome, 'Home ML'),
  mlAway: validateOddsField(f.mlAway, 'Away ML'),
  spreadHomeLine: validateOddsField(f.spreadHomeLine, 'Home line'),
  spreadHomeJuice: validateOddsField(f.spreadHomeJuice, 'Home juice'),
  spreadAwayLine: validateOddsField(f.spreadAwayLine, 'Away line'),
  spreadAwayJuice: validateOddsField(f.spreadAwayJuice, 'Away juice'),
});

const SetLinesModal: React.FC<SetLinesModalProps> = ({ game, onClose, onSave }) => {
  const [form, setForm] = useState<SetLinesFormData>({
    mlHome: toStr(game.odds.moneyline.home),
    mlAway: toStr(game.odds.moneyline.away),
    spreadHomeLine: toStr(game.odds.spread.home.line),
    spreadHomeJuice: toStr(game.odds.spread.home.juice),
    spreadAwayLine: toStr(game.odds.spread.away.line),
    spreadAwayJuice: toStr(game.odds.spread.away.juice),
  });
  const [errors, setErrors] = useState<Errors>({});

  const set = (field: keyof SetLinesFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    const hasErrors = Object.values(errs).some(Boolean);
    if (hasErrors) {
      setErrors(errs);
      return;
    }

    const odds: GameOdds = {
      moneyline: {
        home: parseOdds(form.mlHome)!,
        away: parseOdds(form.mlAway)!,
      },
      spread: {
        home: {
          line: parseOdds(form.spreadHomeLine)!,
          juice: parseOdds(form.spreadHomeJuice)!,
        },
        away: {
          line: parseOdds(form.spreadAwayLine)!,
          juice: parseOdds(form.spreadAwayJuice)!,
        },
      },
    };

    onSave(game.id, odds);
    onClose();
  };

  return (
    <Modal title={`Set Lines — ${game.awayTeam} @ ${game.homeTeam}`} onClose={onClose}>
      <Form onSubmit={handleSubmit}>
        <HintText>Use American odds format: -110, +130, -3.5, etc.</HintText>

        {/* Moneyline */}
        <SectionLabel>Moneyline</SectionLabel>
        <Row>
          <FormField label={`Away — ${game.awayTeam}`} error={errors.mlAway}>
            <Input
              placeholder="-110"
              value={form.mlAway}
              onChange={(e) => set('mlAway', e.target.value)}
            />
          </FormField>
          <FormField label={`Home — ${game.homeTeam}`} error={errors.mlHome}>
            <Input
              placeholder="-110"
              value={form.mlHome}
              onChange={(e) => set('mlHome', e.target.value)}
            />
          </FormField>
        </Row>

        <Divider />

        {/* Spread */}
        <SectionLabel>Spread</SectionLabel>
        <Row>
          <FormField label={`Away Line — ${game.awayTeam}`} error={errors.spreadAwayLine}>
            <Input
              placeholder="+3.5"
              value={form.spreadAwayLine}
              onChange={(e) => set('spreadAwayLine', e.target.value)}
            />
          </FormField>
          <FormField label="Away Juice" error={errors.spreadAwayJuice}>
            <Input
              placeholder="-110"
              value={form.spreadAwayJuice}
              onChange={(e) => set('spreadAwayJuice', e.target.value)}
            />
          </FormField>
        </Row>
        <Row>
          <FormField label={`Home Line — ${game.homeTeam}`} error={errors.spreadHomeLine}>
            <Input
              placeholder="-3.5"
              value={form.spreadHomeLine}
              onChange={(e) => set('spreadHomeLine', e.target.value)}
            />
          </FormField>
          <FormField label="Home Juice" error={errors.spreadHomeJuice}>
            <Input
              placeholder="-110"
              value={form.spreadHomeJuice}
              onChange={(e) => set('spreadHomeJuice', e.target.value)}
            />
          </FormField>
        </Row>

        <Actions>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save Lines</Button>
        </Actions>
      </Form>
    </Modal>
  );
};

export default SetLinesModal;

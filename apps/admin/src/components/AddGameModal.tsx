import React, { useState } from 'react';
import styled from 'styled-components';
import { AddGameFormData, Game } from '../types';
import { colors } from '../styles/GlobalStyles';
import Modal from './Modal';
import FormField, { Input, Select } from './FormField';
import Button from './Button';

interface AddGameModalProps {
  onClose: () => void;
  onAdd: (game: Game) => void;
}

const SPORTS = ['Basketball', 'Football', 'Baseball', 'Soccer', 'Fights'];
const LEAGUES: Record<string, string[]> = {
  Basketball: ['Season', 'Tournament', 'Playoffs', 'Preseason'],
  Football: ['Season', 'Playoffs', 'Scrimmage'],
  Baseball: ['Season', 'Tournament', 'Playoffs', 'Preseason'],
  Soccer: ['Season', 'Tournament', 'Playoffs', 'Scrimmage'],
  Fights: ['Boxing', 'MMA'],
};

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const Row4 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 12px;
`;

const Divider = styled.div`
  height: 1px;
  background-color: ${colors.border};
`;

const SectionLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: -6px;
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

type Errors = Partial<Record<keyof AddGameFormData, string>>;

const DEFAULT_FORM: AddGameFormData = {
  sport: 'Basketball',
  league: 'Season',
  homeTeam: '',
  awayTeam: '',
  startDate: '',
  startTime: '',
  mlAway: '-110',
  mlHome: '-110',
  spreadAwayLine: '+1.5',
  spreadAwayJuice: '-110',
  spreadHomeLine: '-1.5',
  spreadHomeJuice: '-110',
};

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
  if (n === null) return `${label} must be a number`;
  if (n === 0) return `${label} cannot be 0`;
  return undefined;
};

const validateLineField = (val: string, label: string): string | undefined => {
  const n = parseSpreadLine(val);
  if (n === null) return `${label} must be a number`;
  if (n === 0) return `${label} cannot be 0`;
  return undefined;
};

const validate = (f: AddGameFormData): Errors => {
  const errs: Errors = {};
  if (!f.homeTeam.trim()) errs.homeTeam = 'Required';
  if (!f.awayTeam.trim()) errs.awayTeam = 'Required';
  if (!f.startDate) errs.startDate = 'Required';
  if (!f.startTime) errs.startTime = 'Required';
  if (f.homeTeam.trim() && f.awayTeam.trim() && f.homeTeam.trim() === f.awayTeam.trim())
    errs.awayTeam = 'Must differ from home team';
  errs.mlAway = validateOddsField(f.mlAway, 'Away ML');
  errs.mlHome = validateOddsField(f.mlHome, 'Home ML');
  errs.spreadAwayLine = validateLineField(f.spreadAwayLine, 'Away line');
  errs.spreadAwayJuice = validateOddsField(f.spreadAwayJuice, 'Away juice');
  errs.spreadHomeLine = validateLineField(f.spreadHomeLine, 'Home line');
  errs.spreadHomeJuice = validateOddsField(f.spreadHomeJuice, 'Home juice');
  return errs;
};

const AddGameModal: React.FC<AddGameModalProps> = ({ onClose, onAdd }) => {
  const [form, setForm] = useState<AddGameFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Errors>({});

  const set = (field: keyof AddGameFormData, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'sport') updated.league = LEAGUES[value]?.[0] ?? '';
      return updated;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.values(errs).some(Boolean)) { setErrors(errs); return; }

    const startTime = new Date(`${form.startDate}T${form.startTime}`).toISOString();
    const newGame: Game = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sport: form.sport.toLowerCase(),
      league: form.league,
      homeTeam: form.homeTeam.trim(),
      awayTeam: form.awayTeam.trim(),
      startTime,
      status: 'upcoming',
      published: false,
      odds: {
        moneyline: {
          away: parseOdds(form.mlAway)!,
          home: parseOdds(form.mlHome)!,
        },
        spread: {
          away: { line: parseSpreadLine(form.spreadAwayLine)!, juice: parseOdds(form.spreadAwayJuice)! },
          home: { line: parseSpreadLine(form.spreadHomeLine)!, juice: parseOdds(form.spreadHomeJuice)! },
        },
      },
      bettingEnabled: true,
    };

    onAdd(newGame);
    onClose();
  };

  return (
    <Modal title="Add Game" onClose={onClose}>
      <Form onSubmit={handleSubmit}>
        {/* Sport / League */}
        <Row>
          <FormField label="Sport">
            <Select value={form.sport} onChange={(e) => set('sport', e.target.value)}>
              {SPORTS.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </FormField>
          <FormField label="League">
            <Select value={form.league} onChange={(e) => set('league', e.target.value)}>
              {(LEAGUES[form.sport] ?? []).map((l) => <option key={l}>{l}</option>)}
            </Select>
          </FormField>
        </Row>

        <Divider />

        {/* Teams */}
        <FormField label="Away Team" error={errors.awayTeam}>
          <Input placeholder="e.g. Lake Travis" value={form.awayTeam}
            onChange={(e) => set('awayTeam', e.target.value)} />
        </FormField>
        <FormField label="Home Team" error={errors.homeTeam}>
          <Input placeholder="e.g. Austin High" value={form.homeTeam}
            onChange={(e) => set('homeTeam', e.target.value)} />
        </FormField>

        {/* Date / Time */}
        <Row>
          <FormField label="Date" error={errors.startDate}>
            <Input type="date" value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)} />
          </FormField>
          <FormField label="Time" error={errors.startTime}>
            <Input type="time" value={form.startTime}
              onChange={(e) => set('startTime', e.target.value)} />
          </FormField>
        </Row>

        <Divider />

        {/* Opening Lines */}
        <SectionLabel>Moneyline</SectionLabel>
        <HintText>American odds format: -110, +130, etc.</HintText>
        <Row>
          <FormField label={form.awayTeam ? `Away — ${form.awayTeam}` : 'Away'} error={errors.mlAway}>
            <Input placeholder="-110" value={form.mlAway}
              onChange={(e) => set('mlAway', e.target.value)} />
          </FormField>
          <FormField label={form.homeTeam ? `Home — ${form.homeTeam}` : 'Home'} error={errors.mlHome}>
            <Input placeholder="-110" value={form.mlHome}
              onChange={(e) => set('mlHome', e.target.value)} />
          </FormField>
        </Row>

        <SectionLabel>Spread</SectionLabel>
        <Row4>
          <FormField label="Away Line" error={errors.spreadAwayLine}>
            <Input placeholder="+1.5" value={form.spreadAwayLine}
              onChange={(e) => set('spreadAwayLine', e.target.value)} />
          </FormField>
          <FormField label="Away Juice" error={errors.spreadAwayJuice}>
            <Input placeholder="-110" value={form.spreadAwayJuice}
              onChange={(e) => set('spreadAwayJuice', e.target.value)} />
          </FormField>
          <FormField label="Home Line" error={errors.spreadHomeLine}>
            <Input placeholder="-1.5" value={form.spreadHomeLine}
              onChange={(e) => set('spreadHomeLine', e.target.value)} />
          </FormField>
          <FormField label="Home Juice" error={errors.spreadHomeJuice}>
            <Input placeholder="-110" value={form.spreadHomeJuice}
              onChange={(e) => set('spreadHomeJuice', e.target.value)} />
          </FormField>
        </Row4>

        <Actions>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Add Game</Button>
        </Actions>
      </Form>
    </Modal>
  );
};

export default AddGameModal;

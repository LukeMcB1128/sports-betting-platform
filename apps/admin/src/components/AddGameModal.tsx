import React, { useState } from 'react';
import styled from 'styled-components';
import { AddGameFormData, Game, GameOdds } from '../types';
import { colors } from '../styles/GlobalStyles';
import Modal from './Modal';
import FormField, { Input, Select } from './FormField';
import Button from './Button';

interface AddGameModalProps {
  onClose: () => void;
  onAdd: (game: Game) => void;
}

const SPORTS = ['Basketball', 'Football', 'Baseball', 'Soccer'];
const LEAGUES: Record<string, string[]> = {
  Basketball: ['Regular Season', 'Tournament', 'Playoffs', 'Preseason'],
  Football: ['Regular Season', 'Playoffs', 'Scrimmage'],
  Baseball: ['Regular Season', 'Tournament', 'Playoffs', 'Preseason'],
  Soccer: ['Regular Season', 'Tournament', 'Playoffs', 'Scrimmage'],
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

const Divider = styled.div`
  height: 1px;
  background-color: ${colors.border};
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
  league: 'Regular Season',
  homeTeam: '',
  awayTeam: '',
  startDate: '',
  startTime: '',
};

const DEFAULT_ODDS: GameOdds = {
  moneyline: { home: 0, away: 0 },
  spread: {
    home: { line: 0, juice: -110 },
    away: { line: 0, juice: -110 },
  },
};

const validate = (f: AddGameFormData): Errors => {
  const errs: Errors = {};
  if (!f.homeTeam.trim()) errs.homeTeam = 'Required';
  if (!f.awayTeam.trim()) errs.awayTeam = 'Required';
  if (!f.startDate) errs.startDate = 'Required';
  if (!f.startTime) errs.startTime = 'Required';
  if (f.homeTeam.trim() && f.awayTeam.trim() && f.homeTeam.trim() === f.awayTeam.trim())
    errs.awayTeam = 'Away team must differ from home';
  return errs;
};

let nextId = 100;

const AddGameModal: React.FC<AddGameModalProps> = ({ onClose, onAdd }) => {
  const [form, setForm] = useState<AddGameFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Errors>({});

  const set = (field: keyof AddGameFormData, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-update league when sport changes
      if (field === 'sport') {
        updated.league = LEAGUES[value]?.[0] ?? '';
      }
      return updated;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const startTime = new Date(`${form.startDate}T${form.startTime}`).toISOString();
    const newGame: Game = {
      id: String(nextId++),
      sport: form.sport.toLowerCase(),
      league: form.league,
      homeTeam: form.homeTeam.trim(),
      awayTeam: form.awayTeam.trim(),
      startTime,
      status: 'upcoming',
      odds: DEFAULT_ODDS,
    };

    onAdd(newGame);
    onClose();
  };

  return (
    <Modal title="Add Game" onClose={onClose}>
      <Form onSubmit={handleSubmit}>
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

        <FormField label="Away Team" error={errors.awayTeam}>
          <Input
            placeholder="e.g. Lake Travis"
            value={form.awayTeam}
            onChange={(e) => set('awayTeam', e.target.value)}
          />
        </FormField>
        <FormField label="Home Team" error={errors.homeTeam}>
          <Input
            placeholder="e.g. Austin High"
            value={form.homeTeam}
            onChange={(e) => set('homeTeam', e.target.value)}
          />
        </FormField>

        <Divider />

        <Row>
          <FormField label="Date" error={errors.startDate}>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
          </FormField>
          <FormField label="Time" error={errors.startTime}>
            <Input
              type="time"
              value={form.startTime}
              onChange={(e) => set('startTime', e.target.value)}
            />
          </FormField>
        </Row>

        <Actions>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Add Game</Button>
        </Actions>
      </Form>
    </Modal>
  );
};

export default AddGameModal;

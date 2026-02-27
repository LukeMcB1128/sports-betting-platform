import React, { useState } from 'react';
import styled from 'styled-components';
import { Game } from '../types';
import { colors } from '../styles/GlobalStyles';
import Modal from './Modal';
import FormField, { Input } from './FormField';
import Button from './Button';

interface EnterScoreModalProps {
  game: Game;
  onClose: () => void;
  onSave: (gameId: string, awayScore: number, homeScore: number) => void;
}

interface ScoreForm {
  awayScore: string;
  homeScore: string;
}

interface ScoreErrors {
  awayScore?: string;
  homeScore?: string;
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ScoreRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const TeamLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
`;

const Divider = styled.div`
  height: 1px;
  background-color: ${colors.border};
`;

const FinaliseNote = styled.p`
  font-size: 12px;
  color: ${colors.textMuted};
  line-height: 1.5;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const validateScore = (val: string, label: string): string | undefined => {
  if (val === '') return `${label} is required`;
  const n = parseInt(val, 10);
  if (isNaN(n) || n < 0 || !Number.isInteger(n)) return `${label} must be a whole number ≥ 0`;
  return undefined;
};

const EnterScoreModal: React.FC<EnterScoreModalProps> = ({ game, onClose, onSave }) => {
  const [form, setForm] = useState<ScoreForm>({
    awayScore: game.awayScore !== undefined ? String(game.awayScore) : '',
    homeScore: game.homeScore !== undefined ? String(game.homeScore) : '',
  });
  const [errors, setErrors] = useState<ScoreErrors>({});

  const set = (field: keyof ScoreForm, value: string) => {
    // Only allow digits
    if (value !== '' && !/^\d+$/.test(value)) return;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: ScoreErrors = {
      awayScore: validateScore(form.awayScore, 'Away score'),
      homeScore: validateScore(form.homeScore, 'Home score'),
    };
    if (errs.awayScore || errs.homeScore) { setErrors(errs); return; }
    onSave(game.id, parseInt(form.awayScore, 10), parseInt(form.homeScore, 10));
    onClose();
  };

  return (
    <Modal title={`Enter Score — ${game.awayTeam} @ ${game.homeTeam}`} onClose={onClose}>
      <Form onSubmit={handleSubmit}>
        <TeamLabel>{game.league} · {game.awayTeam} @ {game.homeTeam}</TeamLabel>

        <ScoreRow>
          <FormField label={`Away — ${game.awayTeam}`} error={errors.awayScore}>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={form.awayScore}
              onChange={(e) => set('awayScore', e.target.value)}
              autoFocus
            />
          </FormField>
          <FormField label={`Home — ${game.homeTeam}`} error={errors.homeScore}>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={form.homeScore}
              onChange={(e) => set('homeScore', e.target.value)}
            />
          </FormField>
        </ScoreRow>

        <Divider />

        <FinaliseNote>
          After saving, set the game status to <strong>Final</strong> to settle all bets.
        </FinaliseNote>

        <Actions>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save Score</Button>
        </Actions>
      </Form>
    </Modal>
  );
};

export default EnterScoreModal;

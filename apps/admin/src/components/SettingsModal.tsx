import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { colors } from '../styles/GlobalStyles';
import Modal from './Modal';
import FormField, { Input } from './FormField';
import Button from './Button';
import { fetchSettings, saveSettings, AppSettings } from '../api/settingsApi';

interface SettingsModalProps {
  adminToken: string;
  onClose: () => void;
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

const HintText = styled.p`
  font-size: 11px;
  color: ${colors.textMuted};
  margin-top: -10px;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
`;

const SuccessMsg = styled.p`
  font-size: 12px;
  color: ${colors.success};
`;

const ErrorMsg = styled.p`
  font-size: 12px;
  color: ${colors.danger};
`;

const SettingsModal: React.FC<SettingsModalProps> = ({ adminToken, onClose }) => {
  const [parlayMaxPayout, setParlayMaxPayout] = useState<string>('250');
  const [parlayMaxStake, setParlayMaxStake] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings(adminToken)
      .then((s: AppSettings) => {
        setParlayMaxPayout(String(s.parlayMaxPayout));
        setParlayMaxStake(s.parlayMaxStake !== null ? String(s.parlayMaxStake) : '');
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, [adminToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const maxPayout = parseFloat(parlayMaxPayout);
    if (isNaN(maxPayout) || maxPayout <= 0) {
      setError('Parlay max payout must be a positive number.');
      return;
    }

    const maxStakeRaw = parlayMaxStake.trim();
    const maxStake = maxStakeRaw === '' ? null : parseFloat(maxStakeRaw);
    if (maxStake !== null && (isNaN(maxStake) || maxStake <= 0)) {
      setError('Parlay max stake must be a positive number, or leave blank for no limit.');
      return;
    }

    setSaving(true);
    try {
      await saveSettings(adminToken, { parlayMaxPayout: maxPayout, parlayMaxStake: maxStake });
      setSaved(true);
    } catch {
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Settings" onClose={onClose}>
      {loading ? (
        <p style={{ fontSize: 13, color: colors.textMuted }}>Loading…</p>
      ) : (
        <Form onSubmit={handleSubmit}>
          <SectionLabel>Parlay Limits</SectionLabel>
          <HintText>Applied globally to all parlay bets.</HintText>

          <FormField label="Max Payout ($)">
            <Input
              type="number"
              min="1"
              step="1"
              value={parlayMaxPayout}
              onChange={(e) => { setParlayMaxPayout(e.target.value); setSaved(false); }}
            />
          </FormField>

          <FormField label="Max Stake ($) — leave blank for no limit">
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="No limit"
              value={parlayMaxStake}
              onChange={(e) => { setParlayMaxStake(e.target.value); setSaved(false); }}
            />
          </FormField>

          {error && <ErrorMsg>{error}</ErrorMsg>}

          <Actions>
            {saved && <SuccessMsg>Settings saved.</SuccessMsg>}
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </Actions>
        </Form>
      )}
    </Modal>
  );
};

export default SettingsModal;

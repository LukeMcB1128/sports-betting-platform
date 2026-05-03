import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Event, Game } from '../types';
import { colors } from '../styles/GlobalStyles';
import { fetchEvents, createEvent, updateEvent, deleteEvent } from '../api/eventsApi';
import Modal from './Modal';
import Button from './Button';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

// ─── Styled components ────────────────────────────────────────────────────────

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid ${colors.border};
  border-radius: 10px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 620px;
`;

const Th = styled.th`
  text-align: left;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid ${colors.border};
  background-color: ${colors.surfaceHover};
  white-space: nowrap;

  &:first-child { border-radius: 10px 0 0 0; }
  &:last-child  { border-radius: 0 10px 0 0; }
`;

const Td = styled.td`
  padding: 13px 14px;
  border-bottom: 1px solid ${colors.border};
  vertical-align: middle;
  font-size: 13px;

  tr:last-child & { border-bottom: none; }
`;

const Tr = styled.tr<{ active?: boolean }>`
  ${({ active }) => active && `
    td { background-color: rgba(34,197,94,0.05); }
    td:first-child { border-left: 3px solid ${colors.success}; }
  `}
  &:hover td { background-color: ${colors.surfaceHover}; }
`;

const ActiveBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${colors.success};
  background-color: rgba(34,197,94,0.12);
  border: 1px solid ${colors.success}40;
`;

const EmptyCell = styled.td`
  padding: 48px 14px;
  text-align: center;
  color: ${colors.textMuted};
  font-size: 13px;
`;

const Banner = styled.div<{ variant: 'error' | 'success' }>`
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 13px;
  border: 1px solid ${({ variant }) => variant === 'error' ? colors.danger : colors.success}40;
  background-color: ${({ variant }) => variant === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)'};
  color: ${({ variant }) => variant === 'error' ? colors.danger : colors.success};
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
`;

const GameCountBadge = styled.span`
  font-size: 12px;
  color: ${colors.textMuted};
`;

// ─── Form ─────────────────────────────────────────────────────────────────────

const FormRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 14px;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const Input = styled.input`
  padding: 9px 12px;
  border-radius: 7px;
  border: 1px solid ${colors.border};
  background-color: ${colors.surfaceHover};
  color: ${colors.text};
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;

  &:focus { outline: 2px solid ${colors.accent}; outline-offset: 1px; }
`;

const Textarea = styled.textarea`
  padding: 9px 12px;
  border-radius: 7px;
  border: 1px solid ${colors.border};
  background-color: ${colors.surfaceHover};
  color: ${colors.text};
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  min-height: 72px;
  font-family: inherit;

  &:focus { outline: 2px solid ${colors.accent}; outline-offset: 1px; }
`;

const FormActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 18px;
`;

const ErrorText = styled.p`
  color: ${colors.danger};
  font-size: 12px;
  margin-top: 10px;
  text-align: right;
`;

// ─── Component ────────────────────────────────────────────────────────────────

interface EventsPanelProps {
  adminToken: string;
  games: Game[];
}

interface EventForm {
  name: string;
  date: string;
  description: string;
}

const EMPTY_FORM: EventForm = { name: '', date: '', description: '' };

const EventsPanel: React.FC<EventsPanelProps> = ({ adminToken, games }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Event | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ variant: 'error' | 'success'; message: string } | null>(null);

  useEffect(() => {
    fetchEvents(adminToken)
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [adminToken]);

  const gameCounts = Object.fromEntries(
    events.map((e) => [e.id, games.filter((g) => g.eventId === e.id).length])
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditTarget(null);
    setShowCreate(true);
  };

  const openEdit = (event: Event) => {
    setForm({ name: event.name, date: event.date, description: event.description ?? '' });
    setFormError(null);
    setEditTarget(event);
    setShowCreate(true);
  };

  const closeModal = () => {
    setShowCreate(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    if (!form.date) { setFormError('Date is required.'); return; }
    setSaving(true);
    setFormError(null);
    try {
      if (editTarget) {
        const updated = await updateEvent(adminToken, editTarget.id, {
          name: form.name.trim(),
          date: form.date,
          description: form.description.trim(),
        });
        setEvents((prev) => prev.map((e) => (e.id === editTarget.id ? updated : e)));
        setBanner({ variant: 'success', message: `"${updated.name}" updated.` });
      } else {
        const created = await createEvent(adminToken, {
          name: form.name.trim(),
          date: form.date,
          description: form.description.trim() || undefined,
        });
        setEvents((prev) => [created, ...prev]);
        setBanner({ variant: 'success', message: `"${created.name}" created. Set it active when ready.` });
      }
      closeModal();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetActive = async (event: Event) => {
    setActivating(event.id);
    setBanner(null);
    try {
      await updateEvent(adminToken, event.id, { isActive: true });
      setEvents((prev) => prev.map((e) => ({ ...e, isActive: e.id === event.id })));
      setBanner({ variant: 'success', message: `"${event.name}" is now the active event. New games will be assigned to it.` });
    } catch (err: unknown) {
      setBanner({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to activate event.' });
    } finally {
      setActivating(null);
    }
  };

  const handleDelete = async (event: Event) => {
    setDeleting(event.id);
    setBanner(null);
    try {
      await deleteEvent(adminToken, event.id);
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      setBanner({ variant: 'success', message: `"${event.name}" deleted.` });
    } catch (err: unknown) {
      setBanner({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to delete event.' });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      {banner && (
        <Banner variant={banner.variant}>{banner.message}</Banner>
      )}

      <ActionBar>
        <Button variant="primary" onClick={openCreate}>+ New Event</Button>
      </ActionBar>

      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Event</Th>
              <Th>Date</Th>
              <Th>Description</Th>
              <Th>Games</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><EmptyCell colSpan={6}>Loading events…</EmptyCell></tr>
            ) : events.length === 0 ? (
              <tr><EmptyCell colSpan={6}>No events yet. Create one to get started.</EmptyCell></tr>
            ) : (
              events.map((event) => (
                <Tr key={event.id} active={event.isActive}>
                  <Td style={{ fontWeight: 600 }}>{event.name}</Td>
                  <Td style={{ color: colors.textMuted, whiteSpace: 'nowrap' }}>{formatDate(event.date)}</Td>
                  <Td style={{ color: colors.textMuted, maxWidth: 240 }}>
                    {event.description || <span style={{ opacity: 0.4 }}>—</span>}
                  </Td>
                  <Td>
                    <GameCountBadge>{gameCounts[event.id] ?? 0} game{gameCounts[event.id] !== 1 ? 's' : ''}</GameCountBadge>
                  </Td>
                  <Td>
                    {event.isActive ? (
                      <ActiveBadge>● Active</ActiveBadge>
                    ) : (
                      <span style={{ fontSize: 12, color: colors.textMuted }}>Inactive</span>
                    )}
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {!event.isActive && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleSetActive(event)}
                          disabled={activating === event.id}
                        >
                          {activating === event.id ? 'Activating…' : 'Set Active'}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => openEdit(event)}>
                        Edit
                      </Button>
                      {!event.isActive && (gameCounts[event.id] ?? 0) === 0 && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(event)}
                          disabled={deleting === event.id}
                        >
                          {deleting === event.id ? 'Deleting…' : 'Delete'}
                        </Button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </TableWrap>

      {/* ── Create / Edit Modal ─────────────────────────────────────────── */}
      {showCreate && (
        <Modal
          title={editTarget ? `Edit "${editTarget.name}"` : 'New Event'}
          onClose={closeModal}
        >
          <FormRow>
            <Label>Event Name *</Label>
            <Input
              type="text"
              placeholder="Fight Night 3"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </FormRow>
          <FormRow>
            <Label>Date *</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </FormRow>
          <FormRow>
            <Label>Description</Label>
            <Textarea
              placeholder="Optional notes about this event…"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </FormRow>
          {formError && <ErrorText>{formError}</ErrorText>}
          <FormActions>
            <Button variant="ghost" onClick={closeModal} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Event'}
            </Button>
          </FormActions>
        </Modal>
      )}
    </div>
  );
};

export default EventsPanel;

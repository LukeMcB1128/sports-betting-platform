import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { colors } from '../styles/GlobalStyles';
import { signIn, signUp, AuthUser } from '../api/authApi';

// ── Animations ──────────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ── Layout ──────────────────────────────────────────────────────────────────────

const Page = styled.div`
  min-height: 100vh;
  background-color: ${colors.bg};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  background-color: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: 12px;
  padding: 32px;
  animation: ${fadeIn} 0.25s ease;
`;

const BrandRow = styled.div`
  text-align: center;
  margin-bottom: 28px;
`;

const Logo = styled.div`
  font-size: 26px;
  font-weight: 700;
  color: ${colors.accent};
  letter-spacing: -0.5px;
  margin-bottom: 6px;
`;

const Tagline = styled.div`
  font-size: 13px;
  color: ${colors.textMuted};
`;

// ── Tabs ────────────────────────────────────────────────────────────────────────

const TabRow = styled.div`
  display: flex;
  border-bottom: 1px solid ${colors.border};
  margin-bottom: 24px;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: ${({ $active }) => ($active ? colors.accent : colors.textMuted)};
  border-bottom: 2px solid ${({ $active }) => ($active ? colors.accent : 'transparent')};
  margin-bottom: -1px;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: ${({ $active }) => ($active ? colors.accent : colors.text)};
  }
`;

// ── Form ────────────────────────────────────────────────────────────────────────

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const NameRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const Input = styled.input<{ $hasError?: boolean }>`
  background-color: ${colors.surfaceHover};
  border: 1px solid ${({ $hasError }) => ($hasError ? colors.negative : colors.border)};
  border-radius: 8px;
  padding: 10px 12px;
  color: ${colors.text};
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;

  &:focus {
    border-color: ${({ $hasError }) => ($hasError ? colors.negative : colors.accent)};
  }

  &::placeholder {
    color: ${colors.textMuted};
    opacity: 0.6;
  }
`;

const SubmitButton = styled.button<{ $loading?: boolean }>`
  width: 100%;
  padding: 11px;
  background-color: ${colors.accent};
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  margin-top: 4px;
  transition: background-color 0.15s, opacity 0.15s;
  opacity: ${({ $loading }) => ($loading ? 0.7 : 1)};
  cursor: ${({ $loading }) => ($loading ? 'not-allowed' : 'pointer')};

  &:hover:not(:disabled) {
    background-color: ${colors.accentHover};
  }
`;

// ── Alerts ──────────────────────────────────────────────────────────────────────

const Alert = styled.div<{ $variant: 'error' | 'warning' | 'success' }>`
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  background-color: ${({ $variant }) =>
    $variant === 'error'   ? '#2d1414' :
    $variant === 'warning' ? '#2a2210' :
                             '#122d1e'};
  border: 1px solid ${({ $variant }) =>
    $variant === 'error'   ? colors.negative :
    $variant === 'warning' ? '#f59e0b' :
                             colors.positive};
  color: ${({ $variant }) =>
    $variant === 'error'   ? colors.negative :
    $variant === 'warning' ? '#f59e0b' :
                             colors.positive};
`;

const SuccessCard = styled.div`
  text-align: center;
  padding: 8px 0;
`;

const SuccessIcon = styled.div`
  font-size: 40px;
  margin-bottom: 16px;
`;

const SuccessTitle = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: ${colors.text};
  margin-bottom: 8px;
`;

const SuccessBody = styled.div`
  font-size: 13px;
  color: ${colors.textMuted};
  line-height: 1.6;
  margin-bottom: 20px;
`;

const SwitchLink = styled.button`
  background: none;
  border: none;
  color: ${colors.accent};
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;

  &:hover {
    color: ${colors.accentHover};
  }
`;

// ── Component ───────────────────────────────────────────────────────────────────

type Tab = 'signin' | 'signup';

interface LandingPageProps {
  onSignIn: (user: AuthUser) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSignIn }) => {
  const [tab, setTab] = useState<Tab>('signin');

  // Shared fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [password, setPassword]   = useState('');

  // UI state
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [signUpDone, setSignUpDone]   = useState(false);
  const [pendingMsg, setPendingMsg]   = useState<string | null>(null);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPassword('');
    setError(null);
    setPendingMsg(null);
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setSignUpDone(false);
    resetForm();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPendingMsg(null);
    setLoading(true);

    const result = await signIn(firstName.trim(), lastName.trim(), password);
    setLoading(false);

    if (result.success && result.user) {
      onSignIn(result.user);
    } else if (result.status === 'pending' || result.status === 'denied') {
      setPendingMsg(result.error ?? 'Account not verified.');
    } else {
      setError(result.error ?? 'Something went wrong.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    const result = await signUp(firstName.trim(), lastName.trim(), password);
    setLoading(false);

    if (result.success) {
      setSignUpDone(true);
    } else {
      setError(result.error ?? 'Something went wrong.');
    }
  };

  return (
    <Page>
      <Card>
        <BrandRow>
          <Logo>CTXSB</Logo>
          <Tagline>Sports Betting Platform</Tagline>
        </BrandRow>

        <TabRow>
          <Tab $active={tab === 'signin'} onClick={() => switchTab('signin')}>
            Sign In
          </Tab>
          <Tab $active={tab === 'signup'} onClick={() => switchTab('signup')}>
            Sign Up
          </Tab>
        </TabRow>

        {/* ── Sign In ─────────────────────────────────────────────────────── */}
        {tab === 'signin' && (
          <Form onSubmit={handleSignIn}>
            <NameRow>
              <Field>
                <Label>First Name</Label>
                <Input
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoFocus
                  $hasError={!!error}
                />
              </Field>
              <Field>
                <Label>Last Name</Label>
                <Input
                  placeholder="Smith"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  $hasError={!!error}
                />
              </Field>
            </NameRow>

            <Field>
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                $hasError={!!error}
              />
            </Field>

            {error && <Alert $variant="error">{error}</Alert>}

            {pendingMsg && (
              <Alert $variant="warning">
                {pendingMsg}
              </Alert>
            )}

            <SubmitButton type="submit" $loading={loading} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </SubmitButton>

            <div style={{ textAlign: 'center', fontSize: 13, color: colors.textMuted }}>
              No account?{' '}
              <SwitchLink type="button" onClick={() => switchTab('signup')}>
                Sign up
              </SwitchLink>
            </div>
          </Form>
        )}

        {/* ── Sign Up ─────────────────────────────────────────────────────── */}
        {tab === 'signup' && !signUpDone && (
          <Form onSubmit={handleSignUp}>
            <NameRow>
              <Field>
                <Label>First Name</Label>
                <Input
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoFocus
                  $hasError={!!error}
                />
              </Field>
              <Field>
                <Label>Last Name</Label>
                <Input
                  placeholder="Smith"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  $hasError={!!error}
                />
              </Field>
            </NameRow>

            <Field>
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                $hasError={!!error}
              />
            </Field>

            {error && <Alert $variant="error">{error}</Alert>}

            <SubmitButton type="submit" $loading={loading} disabled={loading}>
              {loading ? 'Submitting…' : 'Request Access'}
            </SubmitButton>

            <div style={{ textAlign: 'center', fontSize: 13, color: colors.textMuted }}>
              Already have an account?{' '}
              <SwitchLink type="button" onClick={() => switchTab('signin')}>
                Sign in
              </SwitchLink>
            </div>
          </Form>
        )}

        {/* ── Sign Up Success ──────────────────────────────────────────────── */}
        {tab === 'signup' && signUpDone && (
          <SuccessCard>
            <SuccessIcon>⏳</SuccessIcon>
            <SuccessTitle>Request Submitted</SuccessTitle>
            <SuccessBody>
              Your account request for <strong>{firstName} {lastName}</strong> has been
              submitted. An admin will review and approve your account shortly.
              Once approved, you can sign in with your credentials.
            </SuccessBody>
            <SwitchLink onClick={() => switchTab('signin')}>
              Back to Sign In
            </SwitchLink>
          </SuccessCard>
        )}
      </Card>
    </Page>
  );
};

export default LandingPage;

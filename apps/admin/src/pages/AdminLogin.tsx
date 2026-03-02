import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { colors } from '../styles/GlobalStyles';
import { adminLogin } from '../api/usersApi';

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
  max-width: 380px;
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
  margin-bottom: 4px;
`;

const AdminBadge = styled.div`
  display: inline-block;
  background-color: ${colors.accent};
  color: ${colors.accentText};
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  margin-bottom: 8px;
`;

const Subtitle = styled.div`
  font-size: 13px;
  color: ${colors.textMuted};
`;

// ── Form ────────────────────────────────────────────────────────────────────────

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  background-color: ${colors.inputBg};
  border: 1px solid ${({ $hasError }) => ($hasError ? colors.danger : colors.inputBorder)};
  border-radius: 8px;
  padding: 10px 12px;
  color: ${colors.text};
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;

  &:focus {
    border-color: ${({ $hasError }) => ($hasError ? colors.danger : colors.inputFocus)};
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
  color: ${colors.accentText};
  font-size: 14px;
  font-weight: 700;
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

const ErrorAlert = styled.div`
  padding: 11px 14px;
  border-radius: 8px;
  font-size: 13px;
  background-color: #2d1414;
  border: 1px solid ${colors.danger};
  color: ${colors.danger};
`;

// ── Component ───────────────────────────────────────────────────────────────────

interface AdminLoginProps {
  onLogin: (token: string) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await adminLogin(username.trim(), password);
    setLoading(false);

    if (result.token) {
      onLogin(result.token);
    } else {
      setError(result.error ?? 'Login failed.');
      setPassword('');
    }
  };

  return (
    <Page>
      <Card>
        <BrandRow>
          <Logo>CTXSB</Logo>
          <AdminBadge>Admin Portal</AdminBadge>
          <Subtitle>Sign in to manage the platform</Subtitle>
        </BrandRow>

        <Form onSubmit={handleSubmit}>
          <Field>
            <Label>Username</Label>
            <Input
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              autoComplete="username"
              $hasError={!!error}
            />
          </Field>

          <Field>
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              $hasError={!!error}
            />
          </Field>

          {error && <ErrorAlert>{error}</ErrorAlert>}

          <SubmitButton type="submit" $loading={loading} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </SubmitButton>
        </Form>
      </Card>
    </Page>
  );
};

export default AdminLogin;

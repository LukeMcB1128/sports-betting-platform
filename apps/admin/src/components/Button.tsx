import styled, { css } from 'styled-components';
import { colors } from '../styles/GlobalStyles';

type Variant = 'primary' | 'ghost' | 'danger';

interface ButtonProps {
  variant?: Variant;
  size?: 'sm' | 'md';
}

const Button = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 6px;
  font-weight: 600;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
  white-space: nowrap;

  ${({ size = 'md' }) =>
    size === 'sm'
      ? css`padding: 5px 12px; font-size: 12px;`
      : css`padding: 8px 16px; font-size: 14px;`}

  ${({ variant = 'primary' }) => {
    if (variant === 'primary') return css`
      background-color: ${colors.accent};
      color: ${colors.accentText};
      &:hover { background-color: ${colors.accentHover}; }
    `;
    if (variant === 'ghost') return css`
      background-color: transparent;
      color: ${colors.textMuted};
      border: 1px solid ${colors.border};
      &:hover { background-color: ${colors.surfaceHover}; color: ${colors.text}; }
    `;
    if (variant === 'danger') return css`
      background-color: transparent;
      color: ${colors.danger};
      border: 1px solid ${colors.danger};
      &:hover { background-color: ${colors.danger}; color: #fff; }
    `;
  }}

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

export default Button;

import React from 'react';
import styled from 'styled-components';
import { colors } from '../styles/GlobalStyles';

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export const FieldWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

export const Label = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const Input = styled.input`
  background-color: ${colors.inputBg};
  border: 1px solid ${colors.inputBorder};
  border-radius: 6px;
  color: ${colors.text};
  padding: 8px 10px;
  width: 100%;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: ${colors.inputFocus};
  }

  &::placeholder {
    color: ${colors.textMuted};
  }
`;

export const Select = styled.select`
  background-color: ${colors.inputBg};
  border: 1px solid ${colors.inputBorder};
  border-radius: 6px;
  color: ${colors.text};
  padding: 8px 10px;
  width: 100%;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: ${colors.inputFocus};
  }

  option {
    background-color: ${colors.surface};
  }
`;

export const ErrorText = styled.span`
  font-size: 11px;
  color: ${colors.danger};
`;

const FormField: React.FC<FormFieldProps> = ({ label, error, children }) => (
  <FieldWrap>
    <Label>{label}</Label>
    {children}
    {error && <ErrorText>{error}</ErrorText>}
  </FieldWrap>
);

export default FormField;

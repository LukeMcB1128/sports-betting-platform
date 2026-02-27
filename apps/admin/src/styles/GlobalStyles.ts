import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: #0f1117;
    color: #e8eaf0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    min-height: 100vh;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
  }

  input, select, textarea {
    font-family: inherit;
    font-size: 14px;
  }
`;

// Amber accent to visually distinguish admin from the bettor-facing app
export const colors = {
  bg: '#0f1117',
  surface: '#1a1d27',
  surfaceHover: '#22263a',
  border: '#2a2d3e',
  text: '#e8eaf0',
  textMuted: '#7b8199',
  accent: '#f59e0b',        // amber — admin identity color
  accentHover: '#d97706',
  accentText: '#0f1117',
  danger: '#ef4444',
  dangerHover: '#dc2626',
  success: '#22c55e',
  live: '#ef4444',
  inputBg: '#22263a',
  inputBorder: '#3a3e52',
  inputFocus: '#f59e0b',
};

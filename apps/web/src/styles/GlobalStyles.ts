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
`;

export const colors = {
  bg: '#0f1117',
  surface: '#1a1d27',
  surfaceHover: '#22263a',
  border: '#2a2d3e',
  text: '#e8eaf0',
  textMuted: '#7b8199',
  accent: '#3b82f6',
  accentHover: '#2563eb',
  positive: '#22c55e',  // positive odds / win
  negative: '#ef4444',  // negative odds / loss
  live: '#ef4444',
  selected: '#1e3a5f',
  selectedBorder: '#3b82f6',
};

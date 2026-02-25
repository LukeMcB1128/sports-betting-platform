import React from 'react';
import { GlobalStyles } from './styles/GlobalStyles';
import NavBar from './components/NavBar';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  return (
    <>
      <GlobalStyles />
      <NavBar />
      <Dashboard />
    </>
  );
};

export default App;

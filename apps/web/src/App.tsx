import React, { useState, useEffect } from 'react';
import { GlobalStyles } from './styles/GlobalStyles';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import { getBalance } from './api/betsApi';

const App: React.FC = () => {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    getBalance().then(setBalance).catch(() => setBalance(1000));
  }, []);

  return (
    <>
      <GlobalStyles />
      <NavBar balance={balance} />
      <Home balance={balance ?? 1000} onBalanceChange={setBalance} />
    </>
  );
};

export default App;

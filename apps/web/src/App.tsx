import React, { useState, useEffect } from 'react';
import { GlobalStyles } from './styles/GlobalStyles';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import MyBets from './pages/MyBets';
import { getBalance } from './api/betsApi';

const App: React.FC = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const isMyBets = window.location.pathname === '/bets';

  useEffect(() => {
    getBalance().then(setBalance).catch(() => setBalance(1000));
  }, []);

  return (
    <>
      <GlobalStyles />
      <NavBar balance={balance} />
      {isMyBets ? (
        <MyBets />
      ) : (
        <Home balance={balance ?? 1000} onBalanceChange={setBalance} />
      )}
    </>
  );
};

export default App;

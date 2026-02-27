import React, { useState, useEffect } from 'react';
import { GlobalStyles } from './styles/GlobalStyles';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import MyBets from './pages/MyBets';
import { getBalance } from './api/betsApi';

const BALANCE_POLL_MS = 3000;

const App: React.FC = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const isMyBets = window.location.pathname === '/bets';

  // Poll balance so the NavBar reflects wins/void-refunds without a page reload
  useEffect(() => {
    let cancelled = false;
    const fetchBalance = () => {
      getBalance()
        .then((b) => { if (!cancelled) setBalance(b); })
        .catch(() => { if (balance === null) setBalance(1000); });
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, BALANCE_POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

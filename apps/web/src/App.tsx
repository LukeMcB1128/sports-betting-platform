import React, { useState, useEffect } from 'react';
import { GlobalStyles } from './styles/GlobalStyles';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import MyBets from './pages/MyBets';
import LandingPage from './pages/LandingPage';
import { AuthUser } from './api/authApi';
import { getBalance } from './api/betsApi';

const BALANCE_POLL_MS = 3000;

const App: React.FC = () => {
  const [authedUser, setAuthedUser] = useState<AuthUser | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const isMyBets = window.location.pathname === '/bets';

  // Poll balance only when a user is authenticated
  useEffect(() => {
    if (!authedUser) return;

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
  }, [authedUser]);

  const handleSignOut = () => {
    setAuthedUser(null);
    setBalance(null);
  };

  // Gate — show landing page until the user is signed in and verified
  if (!authedUser) {
    return (
      <>
        <GlobalStyles />
        <LandingPage onSignIn={setAuthedUser} />
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <NavBar
        balance={balance}
        userName={`${authedUser.firstName} ${authedUser.lastName}`}
        onSignOut={handleSignOut}
      />
      {isMyBets ? (
        <MyBets />
      ) : (
        <Home balance={balance ?? 1000} onBalanceChange={setBalance} />
      )}
    </>
  );
};

export default App;

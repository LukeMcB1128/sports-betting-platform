import React, { useState } from 'react';
import { GlobalStyles } from './styles/GlobalStyles';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import MyBets from './pages/MyBets';
import LandingPage from './pages/LandingPage';
import { AuthUser } from './api/authApi';

const App: React.FC = () => {
  const [authedUser, setAuthedUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('authedUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const isMyBets = window.location.pathname === '/bets';

  const handleSignIn = (user: AuthUser) => {
    localStorage.setItem('authedUser', JSON.stringify(user));
    setAuthedUser(user);
  };

  const handleSignOut = () => {
    localStorage.removeItem('authedUser');
    setAuthedUser(null);
  };

  if (!authedUser) {
    return (
      <>
        <GlobalStyles />
        <LandingPage onSignIn={handleSignIn} />
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <NavBar
        userName={`${authedUser.firstName} ${authedUser.lastName}`}
        onSignOut={handleSignOut}
      />
      {isMyBets ? (
        <MyBets />
      ) : (
        <Home />
      )}
    </>
  );
};

export default App;

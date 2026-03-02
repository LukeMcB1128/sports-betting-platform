import React, { useState } from 'react';
import { GlobalStyles } from './styles/GlobalStyles';
import NavBar from './components/NavBar';
import Dashboard from './pages/Dashboard';
import AdminLogin from './pages/AdminLogin';

const App: React.FC = () => {
  const [adminToken, setAdminToken] = useState<string | null>(null);

  const handleLogout = () => setAdminToken(null);

  // Gate — require admin login before showing the dashboard
  if (!adminToken) {
    return (
      <>
        <GlobalStyles />
        <AdminLogin onLogin={setAdminToken} />
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <NavBar adminToken={adminToken} onLogout={handleLogout} />
      <Dashboard />
    </>
  );
};

export default App;

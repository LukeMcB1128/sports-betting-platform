import React from 'react';
import { GlobalStyles } from './styles/GlobalStyles';
import NavBar from './components/NavBar';
import Home from './pages/Home';

const App: React.FC = () => {
  return (
    <>
      <GlobalStyles />
      <NavBar />
      <Home />
    </>
  );
};

export default App;

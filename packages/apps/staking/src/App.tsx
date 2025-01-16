import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import { useAccount } from 'wagmi';

const App: React.FC = () => {
  const { isConnected } = useAccount();
  return (
    <Routes>
      <Route path="/" element={isConnected ? <Dashboard /> : <Home />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;

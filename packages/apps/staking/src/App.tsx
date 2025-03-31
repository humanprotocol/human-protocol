import { FC } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import KVStore from './pages/KVStore';

const App: FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/kvstore" element={<KVStore />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;

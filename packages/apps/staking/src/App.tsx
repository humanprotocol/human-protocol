import { FC } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

import Dashboard from './pages/Dashboard';

const App: FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;

import { FC } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import KVStore from './pages/KVStore';
import { ROUTES } from './constants';

const App: FC = () => {
  return (
    <Routes>
      <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
      <Route path={ROUTES.KVSTORE} element={<KVStore />} />
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} />} />
    </Routes>
  );
};

export default App;

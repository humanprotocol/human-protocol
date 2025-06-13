import { FC } from 'react';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import GraphPage from '@/pages/Graph';
import HomePage from '@/pages/Home';
import LeaderboardPage from '@/pages/Leaderboard';
import SearchResultsPage from '@/pages/SearchResults';

import { ROUTES } from './config/routes';

const AppRoutes: FC = () => {
  return (
    <Router>
      <Routes>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.LEADERBOARD} element={<LeaderboardPage />} />
        <Route path={ROUTES.GRAPH} element={<GraphPage />} />
        <Route path={ROUTES.SEARCH} element={<SearchResultsPage />} />
        <Route path="*" element={<div>Not found</div>} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;

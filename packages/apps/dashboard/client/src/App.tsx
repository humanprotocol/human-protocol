import { FC } from 'react';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Graph from '@pages/Graph';
import Home from '@pages/Home';
import LeaderBoard from '@pages/Leaderboard';
import SearchResults from '@pages/SearchResults';

const App: FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/leaderboard" element={<LeaderBoard />} />
        <Route path="/graph" element={<Graph />} />
        <Route path="/search/:chainId/:address" element={<SearchResults />} />
        <Route path="*" element={<div>Not find</div>} />
      </Routes>
    </Router>
  );
};

export default App;

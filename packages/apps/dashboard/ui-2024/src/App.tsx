import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from '@pages/Home';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/details/:id" element={<div>Details</div>} />
        <Route path="/graph" element={<div>Graph</div>} />
        <Route path="/search/:id" element={<div>Search</div>} />
        <Route path="*" element={<div>Not find</div>} />
      </Routes>
    </Router>
  );
}

export default App;

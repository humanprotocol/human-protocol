import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Solution from './pages/Solution';
import Home from './pages/Home';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/assignment/:assignmentId" element={<Solution />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;

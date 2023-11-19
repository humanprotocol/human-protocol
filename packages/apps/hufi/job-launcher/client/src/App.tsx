import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './layouts';
import AllCampaigns from './pages/Campaigns/AllCampaigns';
import MyCampaigns from './pages/Campaigns/MyCampaigns';
import Participating from './pages/Campaigns/Participating';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import TopUpAccount from './pages/Profile/TopUpAccount';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';

import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="campaigns/allcampaigns"
            element={
              <ProtectedRoute>
                <AllCampaigns />
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaigns/mycampaigns"
            element={
              <ProtectedRoute>
                <MyCampaigns />
              </ProtectedRoute>
            }
          />
          <Route
            path="campaigns/participating"
            element={
              <ProtectedRoute>
                <Participating />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/top-up"
            element={
              <ProtectedRoute>
                <TopUpAccount />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

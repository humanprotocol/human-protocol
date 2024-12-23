import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { IS_MAINNET } from './constants/chains';
import './index.css';
import Layout from './layouts';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import CreateJob from './pages/Job/CreateJob';
import JobDetail from './pages/Job/JobDetail';
import JobList from './pages/Job/JobList';
import Settings from './pages/Profile/Settings';
import TopUpAccount from './pages/Profile/TopUpAccount';
import Transactions from './pages/Profile/Transactions';
import ResetPassword from './pages/ResetPassword';
import ValidateEmail from './pages/ValidateEmail';
import VerifyEmail from './pages/VerifyEmail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/validate" element={<ValidateEmail />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="jobs/create"
            element={
              <ProtectedRoute>
                <CreateJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="jobs/details/:jobId"
            element={
              <ProtectedRoute>
                <JobDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="jobs/:status"
            element={
              <ProtectedRoute>
                <JobList />
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
          <Route
            path="/profile/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />
          {!IS_MAINNET && (
            <>
              <Route
                path="/profile/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </>
          )}
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

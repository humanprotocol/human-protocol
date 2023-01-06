import * as React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { ThemeProvider } from '@mui/material/styles';
import theme from 'ui/theme';
import Home from 'pages/Home';
import { SignUp } from 'pages/SignUp/SignUp';

import Login from 'pages/Login';
import RestorePassword from 'pages/RestorePassword';
import { JobCreatorForm } from 'pages/JobCreatorForm/JobCreatorForm';
import { ConfirmStep } from 'pages/JobCreatorForm/Steps/ConfirmStep';

import { PrivateAuthTokenRoute } from '../Routes';
import { TableDataGrid } from '../Jobs/Table';
import { DashboardLayout } from '../Layouts/DashboardLayout';
import { TableJobItem } from '../Jobs/Table/TableJobItem';

import 'react-toastify/dist/ReactToastify.css';

const AppComponent = () => {
  return (
    <>
      <DashboardLayout>
        <ThemeProvider theme={theme}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route element={<PrivateAuthTokenRoute />}>
              <Route path="/job-create" element={<JobCreatorForm />} />
            </Route>
            <Route element={<PrivateAuthTokenRoute />}>
              <Route path="/job-created-success" element={<ConfirmStep />} />
            </Route>
            <Route element={<PrivateAuthTokenRoute />}>
              <Route path="/jobs" element={<TableDataGrid />} />
            </Route>
            <Route element={<PrivateAuthTokenRoute />}>
              <Route path="/job/:id" element={<TableJobItem />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<RestorePassword />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </ThemeProvider>
      </DashboardLayout>
      <ToastContainer />
    </>
  );
};

export default AppComponent;

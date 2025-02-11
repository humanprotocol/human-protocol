import { Alert, Snackbar } from '@mui/material';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { parseErrorMessage } from '../utils/string';

interface SnackbarContextType {
  openSnackbar: (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info'
  ) => void;
  showError: (error: any) => void;
}

export const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined
);

const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('success');

  const openSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info'
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const showError = (error: any) => {
    openSnackbar(parseErrorMessage(error), 'error');
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <SnackbarContext.Provider value={{ openSnackbar, showError }}>
      {children}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = (): SnackbarContextType => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};

export default SnackbarProvider;

import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleFilledIcon } from '../../components/Icons/CheckCircleFilledIcon';
import * as authService from '../../services/auth';

export const VerifyEmailForm = () => {
  const [alertMsg, setAlertMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const token = new URLSearchParams(window.location.search).get('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    setIsLoading(true);

    authService
      .verifyEmail({ token })
      .then(() => {
        setIsSuccess(true);
        setIsLoading(false);
      })
      .catch((err: any) => {
        setAlertMsg(err?.response?.data?.message ?? err.message);
        setIsLoading(false);
      });
  }, [token]);

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isSuccess) {
    return (
      <Box sx={{ maxWidth: '368px', mx: 'auto', mt: 10, mb: 8 }}>
        <Typography variant="h4" fontWeight={600} sx={{ mb: 6 }}>
          Verify email
        </Typography>
        <Box sx={{ textAlign: 'center' }}>
          <CheckCircleFilledIcon sx={{ fontSize: 128 }} />
        </Box>
        <Typography sx={{ mt: 6 }}>
          You are ready to go. Your email has been successfully verified!
        </Typography>
        <Grid container spacing={1} mt={5}>
          <Grid item xs={12} sm={6}>
            <Button
              size="large"
              variant="outlined"
              color="primary"
              fullWidth
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              size="large"
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => navigate('/')}
            >
              Sign in
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: '303px', mx: 'auto', height: '100%' }}>
      <Typography variant="h4" fontWeight={600} sx={{ mb: 6 }}>
        Verify email
      </Typography>
      {alertMsg && alertMsg.length && (
        <Alert severity="error" onClose={() => setAlertMsg('')} sx={{ mb: 2 }}>
          <AlertTitle>Verify email failed!</AlertTitle>
          {alertMsg}
        </Alert>
      )}
      <Box sx={{ textAlign: 'center', width: '100%', mt: 4 }}>
        <Button
          size="large"
          variant="outlined"
          color="primary"
          fullWidth
          onClick={() => navigate('/')}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

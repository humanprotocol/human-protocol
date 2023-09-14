import { LoadingButton } from '@mui/lab';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Link,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckFilledIcon } from '../../components/Icons/CheckFilledIcon';
import * as authService from '../../services/auth';
import { ResendEmailVerificationForm } from './ResendEmailVerificationForm';

export const VerifyEmailForm = () => {
  const [alertMsg, setAlertMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResend, setIsResend] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const token = new URLSearchParams(window.location.search).get('token');
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      await authService.verifyEmail({ token });
      setIsSuccess(true);
    } catch (err) {
      setAlertMsg(err?.response?.data?.message);
    }
    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <Box sx={{ maxWidth: '368px', mx: 'auto' }}>
        <Box>
          <CheckFilledIcon />
        </Box>
        <Typography variant="h6" fontWeight={500} mt={4}>
          Success!
        </Typography>
        <Box mt={13}>
          <Button
            size="large"
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => navigate('/')}
          >
            Sign in
          </Button>
        </Box>
        <Link
          href="https://humanprotocol.org/app/terms-and-conditions"
          target="_blank"
          sx={{
            fontSize: '12px',
            textAlign: 'center',
            display: 'block',
            width: '100%',
            mt: 3,
          }}
        >
          Terms & conditions
        </Link>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: '303px', mx: 'auto', height: '100%' }}>
      {alertMsg && alertMsg.length && (
        <Alert severity="error" onClose={() => setAlertMsg('')} sx={{ mb: 2 }}>
          <AlertTitle>Verify email failed!</AlertTitle>
          {alertMsg}
        </Alert>
      )}
      {!isResend ? (
        <Box sx={{ textAlign: 'center', width: '100%' }}>
          <LoadingButton
            variant="contained"
            onClick={handleVerify}
            loading={isLoading}
            fullWidth
            size="large"
            sx={{ mb: 4 }}
          >
            Verify
          </LoadingButton>
          <LoadingButton
            variant="outlined"
            onClick={() => setIsResend(true)}
            fullWidth
            size="large"
            sx={{ mb: 4 }}
          >
            Re-send
          </LoadingButton>
          <Link
            href="https://humanprotocol.org/app/terms-and-conditions"
            target="_blank"
            sx={{ fontSize: '12px', textAlign: 'center' }}
          >
            Terms & conditions
          </Link>
        </Box>
      ) : (
        <ResendEmailVerificationForm onFinish={() => setIsSuccess(true)} />
      )}
    </Box>
  );
};

import { LoadingButton } from '@mui/lab';
import {
  Alert,
  AlertTitle,
  Box,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { Formik } from 'formik';
import React, { useState } from 'react';
import * as authService from '../../services/auth';
import { ResendEmailVerificationSchema } from './schema';

export const ResendEmailVerificationForm = ({ onFinish }) => {
  const [alertMsg, setAlertMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResend = async ({ email }) => {
    setIsLoading(true);
    try {
      await authService.resendEmailVerification(email);
      onFinish();
    } catch (err) {
      setAlertMsg(err?.message);
    }
    setIsLoading(false);
  };

  const initialValues = {
    email: '',
  };

  return (
    <Box sx={{ maxWidth: '303px', mx: 'auto', py: 8 }}>
      {alertMsg && alertMsg.length && (
        <Alert severity="error" onClose={() => setAlertMsg('')} sx={{ my: 2 }}>
          <AlertTitle>Send email failed!</AlertTitle>
          {alertMsg}
        </Alert>
      )}
      <Typography fontSize={20} fontWeight={600} mb={4} lineHeight={1.5}>
        Re-send Email Verification
      </Typography>
      <Typography mb={7}>
        Please enter your email so that we can sent you a link to verify email
      </Typography>
      <Formik
        initialValues={initialValues}
        validationSchema={ResendEmailVerificationSchema}
        onSubmit={handleResend}
      >
        {({
          errors,
          touched,
          values,
          dirty,
          isValid,
          handleSubmit,
          handleBlur,
          setFieldValue,
        }) => (
          <form
            style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
          >
            <TextField
              fullWidth
              name="email"
              value={values.email}
              onChange={(e) => setFieldValue('email', e.target.value)}
              onBlur={handleBlur}
              placeholder="Email"
              error={touched.email && errors.email}
              helperText={errors.email}
            />
            <LoadingButton
              fullWidth
              color="primary"
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={!(isValid && dirty)}
              loading={isLoading}
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
          </form>
        )}
      </Formik>
    </Box>
  );
};

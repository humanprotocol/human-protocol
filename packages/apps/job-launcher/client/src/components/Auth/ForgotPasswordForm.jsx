import HCaptcha from '@hcaptcha/react-hcaptcha';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  FormHelperText,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { Formik } from 'formik';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckFilledIcon } from '../../components/Icons/CheckFilledIcon';
import * as authService from '../../services/auth';
import { ForgotPasswordValidationSchema } from './schema';

export const ForgotPasswordForm = () => {
  const captchaRef = useRef(null);
  const [alertMsg, setAlertMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async ({ email }) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setIsSuccess(true);
    } catch (err) {
      setAlertMsg(err?.message);
    }
    setIsLoading(false);
  };

  const initialValues = {
    email: '',
    hcaptchaToken: '',
  };

  return isSuccess ? (
    <Box sx={{ maxWidth: '368px', mx: 'auto', pt: 15 }}>
      <Box>
        <CheckFilledIcon />
      </Box>
      <Typography variant="h6" fontWeight={500} mt={4}>
        Success!
      </Typography>
      <Typography variant="body2" mt={5}>
        Please check your email box for the link to reset your password.
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
  ) : (
    <Box sx={{ maxWidth: '303px', mx: 'auto', py: 8 }}>
      {alertMsg && alertMsg.length && (
        <Alert severity="error" onClose={() => setAlertMsg('')} sx={{ my: 2 }}>
          <AlertTitle>Send email failed!</AlertTitle>
          {alertMsg}
        </Alert>
      )}
      <Typography fontSize={20} fontWeight={600} mb={4} lineHeight={1.5}>
        Reset Password
      </Typography>
      <Typography mb={7}>
        Please enter your email so that we can sent you a reset link to reset
        your password
      </Typography>
      <Formik
        initialValues={initialValues}
        validationSchema={ForgotPasswordValidationSchema}
        onSubmit={handleForgotPassword}
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
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <HCaptcha
                sitekey={import.meta.env.VITE_APP_HCAPTCHA_SITE_KEY}
                endpoint={import.meta.env.VITE_APP_HCAPTCHA_EXCHANGE_URL}
                reportapi={import.meta.env.VITE_APP_HCAPTCHA_LABELING_BASE_URL}
                custom
                onVerify={(token) => setFieldValue('hcaptchaToken', token)}
                ref={captchaRef}
              />
              {errors.hcaptchaToken && (
                <FormHelperText sx={{ mx: '14px', mt: '3px' }} error>
                  {errors.captchPassRequired}
                </FormHelperText>
              )}
            </Box>
            <Box>
              <LoadingButton
                fullWidth
                color="primary"
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={!(isValid && dirty)}
                loading={isLoading}
              >
                Send reset link
              </LoadingButton>
            </Box>
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

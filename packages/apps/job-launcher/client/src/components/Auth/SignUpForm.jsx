import HCaptcha from '@hcaptcha/react-hcaptcha';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  FormHelperText,
  Grid,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { Formik } from 'formik';
import React, { useRef, useState } from 'react';
import { useSnackbar } from '../../providers/SnackProvider';
import * as authService from '../../services/auth';
import { Password } from './Password';
import { RegisterValidationSchema } from './schema';

export const SignUpForm = ({ onFinish, setMode, setTabValue }) => {
  const captchaRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const { showError } = useSnackbar();

  const handleRegister = async ({ email, password }) => {
    setIsLoading(true);
    try {
      const hCaptchaToken = await captchaRef.current.getResponse();
      await authService.signUp({
        email,
        password,
        hCaptchaToken,
      });
      setEmail(email);
      setIsSuccess(true);
    } catch (err) {
      showError(err);
    }
    setIsLoading(false);
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await authService.resendEmailVerification(email);
      onFinish();
    } catch (err) {
      showError(err);
    }
    setIsLoading(false);
  };

  const initialValues = {
    email: '',
    password: '',
    confirm: '',
    hcaptchaToken: '',
  };

  if (isSuccess) {
    return (
      <Box sx={{ maxWidth: '368px', mx: 'auto' }}>
        <Typography variant="h4" fontWeight={600}>
          Verify email
        </Typography>
        <Typography variant="body1" lineHeight={1.5} mt={6}>
          Hi,
          <br />
          <br />
          We’ve sent an email to {email}, please check your inbox and verify
          your email. If you can’t find our email, please check junk junk/spam
          email folder.
        </Typography>
        <Box mt={6}>
          <LoadingButton
            variant="outlined"
            size="large"
            fullWidth
            onClick={handleResend}
            loading={isLoading}
          >
            Resend verification email
          </LoadingButton>
        </Box>
        <Grid container mt={5} spacing={1}>
          <Grid item xs={12} sm={6}>
            <Button
              size="large"
              variant="outlined"
              color="primary"
              fullWidth
              onClick={onFinish}
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
              onClick={() => {
                setMode('sign_in');
                setTabValue(0);
              }}
            >
              Sign in
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '303px', mx: 'auto' }}>
      <Formik
        initialValues={initialValues}
        validationSchema={RegisterValidationSchema}
        onSubmit={handleRegister}
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
            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
          >
            <TextField
              fullWidth
              name="email"
              value={values.email}
              onChange={(e) => setFieldValue('email', e.target.value)}
              onBlur={handleBlur}
              placeholder="your@email.com"
              error={touched.email && errors.email}
              helperText={errors.email}
            />
            <Password
              onChange={(e) => setFieldValue('password', e.target.value)}
              onBlur={handleBlur}
              name="password"
              value={values.password}
              placeholder="Create password"
              error={touched.password && errors.password}
              helperText={errors.password}
            />
            <Password
              onChange={(e) => setFieldValue('confirm', e.target.value)}
              onBlur={handleBlur}
              name="confirm"
              value={values.confirm}
              placeholder="Confirm password"
              error={touched.confirm && errors.confirm}
              helperText={errors.confirm}
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
                Sign up for Job Launcher
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

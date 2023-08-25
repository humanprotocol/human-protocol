import HCaptcha from '@hcaptcha/react-hcaptcha';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  FormHelperText,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { Formik } from 'formik';
import React, { useRef, useState } from 'react';
import { CheckFilledIcon } from '../../components/Icons/CheckFilledIcon';
import * as authService from '../../services/auth';
import { Password } from './Password';
import { RegisterValidationSchema } from './schema';

export const SignUpForm = ({ onFinish, onError }) => {
  const captchaRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async ({ email, password, confirm }) => {
    setIsLoading(true);
    try {
      await authService.signUp({ email, password, confirm });

      setIsSuccess(true);
    } catch (err) {
      onError(err?.message);
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
        <Box>
          <CheckFilledIcon />
        </Box>
        <Typography variant="h6" fontWeight={500} mt={4}>
          Success!
        </Typography>
        <Typography variant="body2" mt={5}>
          Please check your email box for the link to verify email.
        </Typography>
        <Box mt={13}>
          <Button
            size="large"
            variant="contained"
            color="primary"
            fullWidth
            onClick={onFinish}
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

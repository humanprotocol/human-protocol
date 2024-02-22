import HCaptcha from '@hcaptcha/react-hcaptcha';
import { LoadingButton } from '@mui/lab';
import { Box, FormHelperText, Link as MuiLink, TextField } from '@mui/material';
import { useFormik } from 'formik';
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSnackbar } from '../../providers/SnackProvider';
import * as authService from '../../services/auth';
import { useAppDispatch } from '../../state';
import { signIn } from '../../state/auth/reducer';
import { Password } from './Password';
import { LoginValidationSchema } from './schema';

export const SignInForm = () => {
  const captchaRef = useRef(null);
  const [hcaptchaToken, setHcaptchaToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const { showError } = useSnackbar();
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      token: '',
    },
    validationSchema: LoginValidationSchema,
    onSubmit: (values) => handleSignIn(values),
  });

  const handleSignIn = async (body) => {
    setIsLoading(true);
    try {
      const hCaptchaToken = await captchaRef.current.getResponse();
      const data = await authService.signIn({
        email: body.email,
        password: body.password,
        hCaptchaToken,
      });
      dispatch(signIn(data));
    } catch (err) {
      showError(err);
    }
    setIsLoading(false);
  };

  const handleVerificationToken = (token) => {
    setHcaptchaToken(token);
    formik.setFieldValue('token', token);
  };

  return (
    <Box sx={{ maxWidth: '303px', mx: 'auto' }}>
      <form
        style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
        name="form"
        onSubmit={formik.handleSubmit}
      >
        <TextField
          fullWidth
          placeholder="Email"
          type="email"
          name="email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.email === true && formik.errors.email !== undefined
          }
          helperText={formik.errors.email}
        />
        <Box>
          <Password
            placeholder="Password"
            type="password"
            name="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.password === true &&
              formik.errors.password !== undefined
            }
            helperText={formik.errors.password}
          />
          <Link
            to="/forgot-password"
            style={{
              fontSize: '13px',
              textAlign: 'right',
              width: '100%',
              display: 'block',
            }}
          >
            Forgot password
          </Link>
        </Box>
        <Box textAlign="center">
          <HCaptcha
            sitekey={import.meta.env.VITE_APP_HCAPTCHA_SITE_KEY}
            endpoint={import.meta.env.VITE_APP_HCAPTCHA_EXCHANGE_URL}
            reportapi={import.meta.env.VITE_APP_HCAPTCHA_LABELING_BASE_URL}
            custom
            onVerify={(token) => handleVerificationToken(token)}
            ref={captchaRef}
          />
          {formik.isSubmitting && formik.errors.token && (
            <FormHelperText error sx={{ mx: '14px', mt: '3px' }}>
              {formik.errors.token}
            </FormHelperText>
          )}
        </Box>
        <LoadingButton
          fullWidth
          color="primary"
          variant="contained"
          size="large"
          onClick={() => formik.handleSubmit()}
          disabled={!(formik.isValid && formik.dirty && hcaptchaToken)}
          loading={isLoading}
        >
          Sign in to Job Launcher
        </LoadingButton>
        <MuiLink
          href="https://humanprotocol.org/app/terms-and-conditions"
          target="_blank"
          sx={{ fontSize: '12px', textAlign: 'center' }}
        >
          Terms & conditions
        </MuiLink>
      </form>
    </Box>
  );
};

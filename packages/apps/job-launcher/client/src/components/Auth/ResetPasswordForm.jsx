import HCaptcha from '@hcaptcha/react-hcaptcha';
import { LoadingButton } from '@mui/lab';
import { Box, FormHelperText, Link, Typography } from '@mui/material';
import { Formik } from 'formik';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '../../providers/SnackProvider';
import * as authService from '../../services/auth';
import { Password } from './Password';
import { ResetPasswordValidationSchema } from './schema';

export const ResetPasswordForm = () => {
  const captchaRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showError } = useSnackbar();
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get('token');

  const handleResetPassword = async ({ password }) => {
    setIsLoading(true);
    try {
      const hCaptchaToken = await captchaRef.current.getResponse();
      await authService.resetPassword({
        password,
        token,
        hCaptchaToken,
      });

      navigate('/');
    } catch (err) {
      showError(err);
    }
    setIsLoading(false);
  };

  const initialValues = {
    password: '',
    repeatPassword: '',
    hcaptchaToken: '',
  };

  return (
    <Box sx={{ maxWidth: '303px', mx: 'auto', py: 8 }}>
      <Typography fontSize={20} fontWeight={600} mb={4} lineHeight={1.5}>
        Reset Password
      </Typography>
      <Formik
        initialValues={initialValues}
        validationSchema={ResetPasswordValidationSchema}
        onSubmit={handleResetPassword}
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
              onChange={(e) => setFieldValue('repeatPassword', e.target.value)}
              onBlur={handleBlur}
              name="repeatPassword"
              value={values.repeatPassword}
              placeholder="Confirm password"
              error={touched.repeatPassword && errors.repeatPassword}
              helperText={errors.repeatPassword}
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
                Reset Password
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

import HCaptcha from '@hcaptcha/react-hcaptcha';
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
import { ForgotPasswordValidationSchema } from './schema';

export const ForgotPasswordForm = () => {
  const captchaRef = useRef(null);
  const [alertMsg, setAlertMsg] = useState('');

  const handleForgotPassword = () => {};

  const initialValues = {
    email: '',
    hcaptchaToken: '',
  };

  return (
    <Box sx={{ maxWidth: '303px', mx: 'auto', py: 8 }}>
      {alertMsg && alertMsg.length && (
        <Alert severity="error" onClose={() => setAlertMsg('')} sx={{ my: 2 }}>
          <AlertTitle>Login failed!</AlertTitle>
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
              <Button
                fullWidth
                color="primary"
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={!(isValid && dirty)}
              >
                Send reset link
              </Button>
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

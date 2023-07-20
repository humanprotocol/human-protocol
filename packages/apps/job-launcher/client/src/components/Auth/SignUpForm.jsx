import HCaptcha from '@hcaptcha/react-hcaptcha';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  FormHelperText,
  Link,
  TextField,
} from '@mui/material';
import { Formik } from 'formik';
import React, { useRef, useState } from 'react';
// import { useDispatch } from 'react-redux';
import { Password } from './Password';
import { RegisterValidationSchema } from './schema';

export const SignUpForm = () => {
  //   const dispatch = useDispatch();
  const captchaRef = useRef(null);
  const [alertMsg, setAlertMsg] = useState('');

  const handleRegister = () => {};

  const initialValues = {
    email: '',
    password: '',
    repeatPassword: '',
    hcaptchaToken: '',
  };

  return (
    <Box sx={{ maxWidth: '392px', mx: 'auto' }}>
      {alertMsg && alertMsg.length && (
        <Alert severity="error" onClose={() => setAlertMsg('')} sx={{ mb: 2 }}>
          <AlertTitle>Login failed!</AlertTitle>
          {alertMsg}
        </Alert>
      )}
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
                Sign up for Job Launcher
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

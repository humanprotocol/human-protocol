import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Box, Button, FormHelperText, Link, TextField } from '@mui/material';
import { Formik } from 'formik';
import React, { useRef } from 'react';
import { Password } from './Password';
import { RegisterValidationSchema } from './schema';

export const SignUpForm = ({ onSignUp }) => {
  const captchaRef = useRef(null);

  const handleRegister = async ({ email, password, confirm }) => {
    const body = { email, password, confirm };
    onSignUp(body);
  };

  const initialValues = {
    email: '',
    password: '',
    confirm: '',
    hcaptchaToken: '',
  };

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

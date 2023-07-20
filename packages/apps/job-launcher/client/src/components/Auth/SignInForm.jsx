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
import { useFormik } from 'formik';
import React, { useRef, useState } from 'react';
// import { useDispatch } from 'react-redux';
import { Password } from './Password';
import { LoginValidationSchema } from './schema';

export const SignInForm = () => {
  //   const dispatch = useDispatch();
  const captchaRef = useRef(null);
  const [hcaptchaToken, setHcaptchaToken] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      token: '',
    },
    validationSchema: LoginValidationSchema,
    onSubmit: (values, { setSubmitting }) => {
      console.log(values, setSubmitting);
      //   setSubmitting(true);
      //   dispatch(startGlobalLoading());
      //   signIn({ ...values, hcaptchaToken })
      //     .then((res) => {
      //       if (res) {
      //         const { user } = res;
      //         dispatch({
      //           type: 'AUTH_SUCCESS',
      //           payload: res,
      //         });
      //         dispatch({
      //           type: 'AUTH_SIGN_IN',
      //           payload: user.isEmailVerified,
      //         });
      //         setHcaptchaToken('');
      //         setSubmitting(false);
      //         if (user.isEmailVerified)
      //           history.push({ pathname: Routes.Workspace.path });
      //         else
      //           history.push({
      //             pathname: Routes.Register.path,
      //             search: `?step=verify_email`,
      //           });
      //       } else {
      //         setHcaptchaToken('');
      //         setSubmitting(false);
      //         captchaRef.current.resetCaptcha();
      //       }
      //     })
      //     .catch((err) => {
      //       setAlertMsg(err.message);
      //       setHcaptchaToken('');
      //       setSubmitting(false);
      //       captchaRef.current.resetCaptcha();
      //     })
      //     .finally(() => dispatch(finishGlobalLoading()));
    },
  });

  const handleVerificationToken = (token) => {
    setHcaptchaToken(token);
    formik.setFieldValue('token', token);
  };

  return (
    <Box sx={{ maxWidth: '392px', mx: 'auto' }}>
      {alertMsg && alertMsg.length && (
        <Alert severity="error" onClose={() => setAlertMsg('')} sx={{ mb: 2 }}>
          <AlertTitle>Login failed!</AlertTitle>
          {alertMsg}
        </Alert>
      )}
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
            href="/forgot-password"
            sx={{
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
        <Button
          fullWidth
          color="primary"
          variant="contained"
          size="large"
          onClick={() => formik.handleSubmit()}
          disabled={!(formik.isValid && formik.dirty && hcaptchaToken)}
        >
          Sign in to Job Launcher
        </Button>
        <Link
          href="https://humanprotocol.org/app/terms-and-conditions"
          target="_blank"
          sx={{ fontSize: '12px', textAlign: 'center' }}
        >
          Terms & conditions
        </Link>
      </form>
    </Box>
  );
};

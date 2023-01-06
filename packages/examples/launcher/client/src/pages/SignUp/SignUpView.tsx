import { Grid, Box, Typography } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { object, string, TypeOf } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import logoImg from '../../assets/images/logo.svg';
import FormInput from '../../components/FormInput/FormInput';

const signUpSchema = object({
  email: string().min(1, 'Email is empty').email('Email is invalid'),
  password: string().regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/,
    'Password must be more than 8 characters, should include 1 uppercase, 1 lowercase, 1 numeric, and 1 special character.'
  ),
  confirm: string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirm, {
  path: ['confirm'],
  message: 'Passwords do not match',
});

export type ISignUpSchema = TypeOf<typeof signUpSchema>;

interface ISignUp {
  onSubmitHandler: (values: ISignUpSchema) => void;
}

export const SignUpView: React.FC<ISignUp> = ({ onSubmitHandler }) => {
  const defaultValues: ISignUpSchema = {
    email: '',
    password: '',
    confirm: '',
  };

  const methods = useForm<ISignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues,
  });

  return (
    <FormProvider {...methods}>
      <Grid
        item
        container
        justifyContent="center"
        rowSpacing={5}
        sx={{
          maxWidth: { sm: '40rem' },
          marginInline: 'auto',
        }}
      >
        <Grid item xs={12} sm={10}>
          <img src={logoImg} alt="logo" />
          <Typography variant="h2" color="primary" textAlign="center" mb={3}>
            Register at Job Launcher
          </Typography>
          <Box
            display="flex"
            flexDirection="column"
            component="form"
            noValidate
            autoComplete="on"
            sx={{ margin: '0 auto' }}
            onSubmit={methods.handleSubmit(onSubmitHandler)}
          >
            <FormInput
              label="Enter your email"
              type="email"
              name="email"
              variant="outlined"
              autoComplete="sign-up-email"
            />
            <FormInput
              type="password"
              label="Password"
              name="password"
              variant="outlined"
              autoComplete="password"
            />
            <FormInput
              type="password"
              label="Confirm Password"
              name="confirm"
              variant="outlined"
              autoComplete="confirm"
            />

            <LoadingButton
              loading={false}
              type="submit"
              variant="contained"
              sx={{
                py: '0.8rem',
                width: '100%',
                marginInline: 'auto',
              }}
            >
              Sign Up
            </LoadingButton>
          </Box>
        </Grid>
      </Grid>
    </FormProvider>
  );
};

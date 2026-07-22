import { type SubmitEvent } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Box, Divider, Grid, Link as MuiLink, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Input } from '@/shared/components/data-entry/input';
import { Button } from '@/shared/components/ui/button';
import { Password } from '@/shared/components/data-entry/password';
import { useColorMode } from '@/shared/contexts/color-mode/use-color-mode';
import { useResetMutationErrors } from '@/shared/hooks/use-reset-mutation-errors';
import { HCaptchaForm } from '@/shared/components/hcaptcha';
import { routerPaths } from '@/router/router-paths';

import { type SignInDto, signInDtoSchema } from './schemas';

interface SignInFormProps {
  onSubmit: (data: SignInDto) => void;
  error?: unknown;
  isLoading?: boolean;
  resetMutation: () => void;
}

export function SignInForm({
  onSubmit,
  error,
  isLoading,
  resetMutation,
}: SignInFormProps) {
  const { t } = useTranslation();
  const { colorPalette } = useColorMode();

  const methods = useForm({
    defaultValues: {
      email: '',
      password: '',
      h_captcha_token: '',
    },
    resolver: zodResolver(signInDtoSchema),
  });

  useResetMutationErrors(methods.watch, resetMutation);

  const handleSubmit = (event: SubmitEvent) => {
    void methods.handleSubmit(onSubmit)(event);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit}>
        <Grid container sx={{ gap: 3 }}>
          <Input
            fullWidth
            label={t('worker.signInForm.fields.email')}
            name="email"
          />
          <Password
            fullWidth
            label={t('worker.signInForm.fields.password')}
            name="password"
          />
          <Box sx={{ width: '100%' }}>
            <MuiLink
              component={Link}
              to={routerPaths.worker.sendResetLink}
              variant="body1"
              sx={{
                color: colorPalette.text.primary,
                fontSize: '14px',
                lineHeight: '150%',
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              {t('worker.signInForm.forgotPassword')}
            </MuiLink>
          </Box>
          <HCaptchaForm error={error} name="h_captcha_token" />
          <Button
            type="submit"
            variant="contained"
            color="accent"
            fullWidth
            loading={isLoading}
          >
            {t('worker.signInForm.submitBtn')}
          </Button>
          <Box sx={{ position: 'relative', width: '100%' }}>
            <Divider sx={{ bgcolor: '#c9c9c9' }} />
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 700,
                lineHeight: '125%',
                letterSpacing: '0.25px',
                color: colorPalette.text.primary,
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: colorPalette.background.paper,
              }}
            >
              {t('worker.signInForm.or')}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mx: 'auto',
              gap: 1,
              '& > *': {
                display: 'inline-flex',
              },
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '26px',
                letterSpacing: '0.1px',
                color: colorPalette.text.auxiliary200,
              }}
            >
              {t('worker.signInForm.dontHaveAccount')}
            </Typography>{' '}
            <MuiLink
              component={Link}
              to={routerPaths.worker.signUp}
              sx={{
                color: colorPalette.accent.main,
                fontSize: '14px',
                fontWeight: 600,
                lineHeight: '26px',
                letterSpacing: '0.1px',
                textDecoration: 'underline',
              }}
            >
              {t('worker.signInForm.signUp')}
            </MuiLink>
          </Box>
        </Grid>
      </form>
    </FormProvider>
  );
}

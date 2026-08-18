import { type SubmitEvent } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Box, Grid, Link as MuiLink } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Input } from '@/shared/components/data-entry/input';
import { Button } from '@/shared/components/ui/button';
import { Password } from '@/shared/components/data-entry/password';
import { useResetMutationErrors } from '@/shared/hooks/use-reset-mutation-errors';
import { HCaptchaForm } from '@/shared/components/hcaptcha';
import { routerPaths } from '@/router/router-paths';
import { type SignInDto, signInDtoSchema } from '../schemas';

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
          <Input fullWidth label={t('signInForm.fields.email')} name="email" />
          <Password
            fullWidth
            label={t('signInForm.fields.password')}
            name="password"
          />
          <Box sx={{ width: '100%' }}>
            <MuiLink
              component={Link}
              to={routerPaths.sendResetLink}
              variant="body2"
              sx={{
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              {t('signInForm.forgotPassword')}
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
            {t('signInForm.submitBtn')}
          </Button>
          {/* <Box sx={{ position: 'relative', width: '100%' }}>
            <Divider sx={{ bgcolor: 'border.main' }} />
            <Typography
              variant="body2"
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'background.paper',
                fontWeight: 700,
              }}
            >
              {t('signInForm.or')}
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
            <Typography variant="body2" sx={{ color: 'text.auxiliary200' }}>
              {t('signInForm.dontHaveAccount')}
            </Typography>{' '}
            <MuiLink
              component={Link}
              to={routerPaths.signUp}
              variant="body2"
              sx={{
                color: 'accent.main',
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              {t('signInForm.signUp')}
            </MuiLink>
          </Box> */}
        </Grid>
      </form>
    </FormProvider>
  );
}

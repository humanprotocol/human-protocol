/* eslint-disable camelcase -- ...*/
import { FormProvider, useForm } from 'react-hook-form';
import { Box, Grid, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Input } from '@/shared/components/data-entry/input';
import { Button } from '@/shared/components/ui/button';
import { Password } from '@/shared/components/data-entry/password/password';
import { routerPaths } from '@/router/router-paths';
import { type SignInDto } from '@/modules/worker/services/sign-in/types';
import { signInDtoSchema } from '@/modules/worker/services/sign-in/schema';
import { useResetMutationErrors } from '@/shared/hooks/use-reset-mutation-errors';
import { HCaptchaForm } from '@/shared/components/hcaptcha/h-captcha-form';

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
}: Readonly<SignInFormProps>) {
  const { t } = useTranslation();

  const methods = useForm<SignInDto>({
    defaultValues: {
      email: '',
      password: '',
      h_captcha_token: '',
    },
    resolver: zodResolver(signInDtoSchema),
  });

  useResetMutationErrors(methods.watch, resetMutation);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void methods.handleSubmit(onSubmit)(event);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit}>
        <Grid container gap="1.5rem">
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
          <Box width="100%">
            <Typography variant="body1">
              <Link
                style={{
                  textDecoration: 'none',
                  fontWeight: 600,
                  color: 'inherit',
                }}
                to={routerPaths.worker.sendResetLink}
              >
                {t('worker.signInForm.forgotPassword')}
              </Link>
            </Typography>
          </Box>
          <HCaptchaForm error={error} name="h_captcha_token" />
          <Button
            fullWidth
            loading={isLoading}
            type="submit"
            variant="contained"
          >
            {t('worker.signInForm.submitBtn')}
          </Button>
        </Grid>
      </form>
    </FormProvider>
  );
}

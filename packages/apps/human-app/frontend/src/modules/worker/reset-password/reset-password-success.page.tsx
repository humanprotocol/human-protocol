import { useEffect } from 'react';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import { Stack, Typography } from '@mui/material';
import CheckCircle from '@mui/icons-material/CheckCircle';

import { Button } from '@/shared/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { PageCard } from '@/shared/components/ui/page-card';

export function ResetPasswordSuccessPage() {
  const { signOut, user } = useAuth();

  useEffect(() => {
    if (user) {
      signOut();
    }
  }, [user, signOut]);

  return (
    <PageCard
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        py: { xs: 3, md: 0 },
        px: { xs: 2, md: 0 },
      }}
    >
      <Stack
        sx={{
          width: { xs: '100%', md: '400px' },
          gap: 3,
          alignItems: { xs: 'flex-start', md: 'center' },
        }}
      >
        <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
          <CheckCircle fontSize="large" sx={{ color: 'success.main' }} />
          <Typography
            component="h3"
            variant="h6"
            sx={{ color: 'text.auxiliary100' }}
          >
            {t('worker.resetPasswordSuccess.title')}
          </Typography>
        </Stack>
        <Stack sx={{ gap: 3 }}>
          <Typography variant="body4" sx={{ color: 'text.auxiliary100' }}>
            {t('worker.resetPasswordSuccess.description')}
          </Typography>
          <Button
            component={Link}
            to={routerPaths.signIn}
            variant="contained"
            color="accent"
            fullWidth
          >
            {t('worker.resetPasswordSuccess.btn')}
          </Button>
        </Stack>
      </Stack>
    </PageCard>
  );
}

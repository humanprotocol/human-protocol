import { t } from 'i18next';
import { Link } from 'react-router-dom';
import { Stack, Typography } from '@mui/material';

import { Button } from '@/shared/components/ui/button';
import { SuccessIcon } from '@/shared/components/ui/icons';
import { routerPaths } from '@/router/router-paths';
import { PageCard } from '@/shared/components/ui/page-card';

export function EmailVerificationSuccessMessage() {
  return (
    <PageCard
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Stack sx={{ gap: 2.5, alignItems: 'center' }}>
        <SuccessIcon sx={{ fontSize: { xs: 56, md: 72 } }} />
        <Typography component="h3" variant="body3">
          {t('worker.emailVerification.title')}
        </Typography>
        <Button
          component={Link}
          to={routerPaths.signIn}
          variant="contained"
          color="accent"
          fullWidth
          sx={{ width: '200px' }}
        >
          {t('worker.emailVerification.btn')}
        </Button>
      </Stack>
    </PageCard>
  );
}

import { Grid, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { PageCard } from '@/components/ui/page-card';
import { Button } from '@/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { colorPalette } from '@/styles/color-palette';
import { useLocationState } from '@/hooks/use-location-state';

export function SendResetLinkWorkerSuccessPage() {
  const { t } = useTranslation();
  const { field: email } = useLocationState({
    keyInStorage: 'email',
    schema: z.string().email(),
  });

  return (
    <PageCard title={t('worker.sendResetLinkForm.title')}>
      <Grid container gap="2rem">
        <Typography>
          <Trans
            i18nKey="worker.sendResetLinkSuccess.paragraph1"
            values={{ email }}
          >
            Strong <Typography variant="buttonMedium" />
          </Trans>
        </Typography>
        <Typography color={colorPalette.primary.light} variant="body1">
          {t('worker.sendResetLinkSuccess.paragraph2')}
        </Typography>
        <Typography variant="body1">
          <Trans
            i18nKey="worker.sendResetLinkSuccess.paragraph3"
            values={{ email }}
          >
            Strong <Typography variant="buttonMedium" />
          </Trans>
        </Typography>
        <Button
          component={Link}
          fullWidth
          to={routerPaths.worker.signIn}
          variant="contained"
        >
          {t('worker.sendResetLinkSuccess.btn')}
        </Button>

        <Typography variant="body1">
          <Trans
            i18nKey="worker.sendResetLinkSuccess.paragraph4"
            values={{ email }}
          >
            Strong
            <Typography variant="buttonMedium" />
            <Link to={routerPaths.homePage} />
          </Trans>
        </Typography>
      </Grid>
    </PageCard>
  );
}

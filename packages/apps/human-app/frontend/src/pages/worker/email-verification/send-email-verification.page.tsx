import { Grid, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { routerPaths } from '@/router/router-paths';
import { colorPalette } from '@/styles/color-palette';
import { PageCard } from '@/components/ui/page-card';
import { useLocationState } from '@/hooks/use-location-state';

export function SendEmailVerificationWorkerPage() {
  const { t } = useTranslation();
  const { field: email } = useLocationState({
    keyInStorage: 'email',
    schema: z.string().email(),
  });

  return (
    <PageCard title={t('worker.sendEmailVerification.title')}>
      <Grid container gap="2rem">
        <Typography>
          <Trans
            i18nKey="worker.sendEmailVerification.paragraph1"
            values={{ email }}
          >
            Strong <Typography variant="buttonMedium" />
          </Trans>
        </Typography>
        <Typography color={colorPalette.primary.light} variant="body1">
          {t('worker.sendEmailVerification.paragraph2')}
        </Typography>
        <Typography variant="body1">
          <Trans
            i18nKey="worker.sendEmailVerification.paragraph3"
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

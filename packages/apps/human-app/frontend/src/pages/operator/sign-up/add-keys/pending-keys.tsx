import { Grid, Typography } from '@mui/material';
import { t } from 'i18next';
import type { PendingKeys } from '@/smart-contracts/keys/fake-keys-smart-contract';

export function PendingKeys({
  pendingKeys: { role, url, annotationURL },
}: {
  pendingKeys: PendingKeys;
}) {
  return (
    <Grid container sx={{ flexDirection: 'column', gap: '2rem' }}>
      <Typography variant="body4">
        {t('operator.addKeysPage.pendingKeys.title')}
      </Typography>
      <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
        <Typography variant="subtitle2">
          {t('operator.addKeysPage.pendingKeys.role')}
        </Typography>
        <Typography variant="body1">{role}</Typography>
      </Grid>
      <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
        <Typography variant="subtitle2">
          {t('operator.addKeysPage.pendingKeys.annotationUrl')}
        </Typography>
        <Typography variant="body1">{annotationURL}</Typography>
      </Grid>
      <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
        <Typography variant="subtitle2">
          {t('operator.addKeysPage.pendingKeys.url')}
        </Typography>
        <Typography variant="body1">{url}</Typography>
      </Grid>
    </Grid>
  );
}

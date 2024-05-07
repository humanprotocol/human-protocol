import { Grid, Typography } from '@mui/material';
import { t } from 'i18next';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import { Chips } from '@/components/ui/chips';
import { Button } from '@/components/ui/button';
import { colorPalette } from '@/styles/color-palette';
import type { UseFormResult } from '@/pages/operator/sign-up/add-keys/add-keys.page';
import { EthKVStoreKeys } from '@/smart-contracts/EthKVStore/config';

function EmptyPlaceholder() {
  return (
    <Typography color={colorPalette.text.disabled} variant="helperText">
      {t('operator.addKeysPage.existingKeys.noValue')}
    </Typography>
  );
}

export function ExistingKeys({
  openEditMode,
  useFormResult,
}: {
  useFormResult: UseFormResult;
  openEditMode: () => void;
}) {
  const { getValues } = useFormResult;
  const publicKey = getValues('Public Key');
  const webhookUrl = getValues('Webhook Url');
  const role = getValues('Role');
  const recordingOracle = getValues('Recording Oracle');

  return (
    <Grid container sx={{ flexDirection: 'column', gap: '2rem' }}>
      <Typography variant="body4">
        {t('operator.addKeysPage.existingKeys.title')}
      </Typography>
      <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
        <Typography variant="subtitle2" width="100%">
          {EthKVStoreKeys.PublicKey}
        </Typography>
        <Typography variant="body1" width="100%">
          {publicKey ? (
            <Grid
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
              width="100%"
            >
              {publicKey}
            </Grid>
          ) : (
            <EmptyPlaceholder />
          )}
        </Typography>
      </Grid>
      <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
        <Typography variant="subtitle2" width="100%">
          {EthKVStoreKeys.WebhookUrl}
        </Typography>
        <Typography variant="body1" width="100%">
          {webhookUrl ? (
            <Grid
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
              width="100%"
            >
              {webhookUrl}
            </Grid>
          ) : (
            <EmptyPlaceholder />
          )}
        </Typography>
      </Grid>
      <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
        <Typography variant="subtitle2" width="100%">
          {EthKVStoreKeys.Role}
        </Typography>
        {role.length ? <Chips data={role} /> : <EmptyPlaceholder />}
      </Grid>
      <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
        <Typography variant="subtitle2">
          {EthKVStoreKeys.RecordingOracle}
        </Typography>
        <Typography variant="body1">
          {recordingOracle ? (
            <Grid
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
              width="100%"
            >
              {recordingOracle}
            </Grid>
          ) : (
            <EmptyPlaceholder />
          )}
        </Typography>
      </Grid>
      <div>
        <Button
          fullWidth={false}
          onClick={openEditMode}
          startIcon={<ModeEditIcon sx={{ fill: colorPalette.white }} />}
          variant="contained"
        >
          <Typography color={colorPalette.white} variant="buttonMedium">
            {t('operator.addKeysPage.existingKeys.editBtn')}
          </Typography>
        </Button>
      </div>
    </Grid>
  );
}

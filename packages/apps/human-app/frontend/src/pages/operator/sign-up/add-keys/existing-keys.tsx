import { Grid, Typography } from '@mui/material';
import { t } from 'i18next';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { colorPalette } from '@/styles/color-palette';
import { EthKVStoreKeys } from '@/smart-contracts/EthKVStore/config';
import { OptionalText } from '@/components/ui/optional-text';
import { EmptyPlaceholder } from '@/components/ui/empty-placeholder';
import type { GetEthKVStoreValuesSuccessResponse } from '@/api/servieces/operator/get-keys';
import { Chips } from '@/components/ui/chips';
import { Chip } from '@/components/ui/chip';

export function ExistingKeys({ openEditMode }: { openEditMode: () => void }) {
  const { getValues } = useFormContext<GetEthKVStoreValuesSuccessResponse>();
  const publicKey = getValues(EthKVStoreKeys.PublicKey);
  const webhookUrl = getValues(EthKVStoreKeys.WebhookUrl);
  const role = getValues(EthKVStoreKeys.Role);
  const fee = getValues(EthKVStoreKeys.Fee);
  const jobTypes = getValues(EthKVStoreKeys.JobTypes);

  return (
    <Grid container sx={{ flexDirection: 'column', gap: '2rem' }}>
      <Typography variant="body4">
        {t('operator.addKeysPage.existingKeys.title')}
      </Typography>
      <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
        <Typography variant="subtitle2">
          {t('operator.addKeysPage.existingKeys.fee')}
        </Typography>
        <Typography variant="body1">
          <OptionalText text={fee?.toString()} />
        </Typography>
      </Grid>
      <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
        <Typography variant="subtitle2" width="100%">
          {t('operator.addKeysPage.existingKeys.publicKey')}
        </Typography>
        <Typography variant="body1" width="100%">
          <OptionalText text={publicKey} />
        </Typography>
      </Grid>
      <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
        <Typography variant="subtitle2" width="100%">
          {t('operator.addKeysPage.existingKeys.webhookUrl')}
        </Typography>
        <Typography variant="body1" width="100%">
          <OptionalText text={webhookUrl} />
        </Typography>
      </Grid>
      <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
        <Typography variant="subtitle2" width="100%">
          {t('operator.addKeysPage.existingKeys.role')}
        </Typography>
        <div>{role ? <Chip label={role} /> : <EmptyPlaceholder />}</div>
      </Grid>
      <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
        <Typography variant="subtitle2" width="100%">
          {t('operator.addKeysPage.existingKeys.jobType')}
        </Typography>
        <div>{jobTypes ? <Chips data={jobTypes} /> : <EmptyPlaceholder />}</div>
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

import { Grid, Typography } from '@mui/material';
import { t } from 'i18next';
import { Input } from '@/components/data-entry/input';
import { EthKVStoreKeys, Role } from '@/smart-contracts/EthKVStore/config';
import { Select } from '@/components/data-entry/select';
import { MultiSelect } from '@/components/data-entry/multi-select';
import { JOB_TYPES } from '@/shared/consts';
import type { GetEthKVStoreValuesSuccessResponse } from '@/api/servieces/operator/get-keys';

const OPTIONS = [Role.ExchangeOracle, Role.JobLauncher, Role.RecordingOracle];

export function EditPendingKeysForm({
  existingKeysInitialState,
}: {
  existingKeysInitialState: GetEthKVStoreValuesSuccessResponse;
}) {
  return (
    <Grid container sx={{ flexDirection: 'column', gap: '1rem' }}>
      <Typography variant="body4">
        {t('operator.addKeysPage.pendingKeys.title')}
      </Typography>
      <Grid container sx={{ flexDirection: 'column', gap: '2rem' }}>
        {!existingKeysInitialState.fee ? (
          <Input
            fullWidth
            label={t('operator.addKeysPage.pendingKeys.fee')}
            mask="PercentsInputMask"
            name={EthKVStoreKeys.Fee}
          />
        ) : null}
        {!existingKeysInitialState.public_key ? (
          <Input
            fullWidth
            label={t('operator.addKeysPage.pendingKeys.publicKey')}
            name={EthKVStoreKeys.PublicKey}
          />
        ) : null}
        {!existingKeysInitialState.webhook_url ? (
          <Input
            fullWidth
            label={t('operator.addKeysPage.pendingKeys.webhookUrl')}
            name={EthKVStoreKeys.WebhookUrl}
          />
        ) : null}
        {!existingKeysInitialState.webhook_url ? (
          <Select
            isChipRenderValue
            label={t('operator.addKeysPage.pendingKeys.role')}
            name={EthKVStoreKeys.Role}
            options={OPTIONS.map((role, i) => ({
              name: role,
              value: role,
              id: i,
            }))}
          />
        ) : null}
        {!existingKeysInitialState.job_types ? (
          <MultiSelect
            label={t('operator.addKeysPage.pendingKeys.jobType')}
            name={EthKVStoreKeys.JobTypes}
            options={JOB_TYPES}
          />
        ) : null}
      </Grid>
    </Grid>
  );
}

import { Grid, Typography } from '@mui/material';
import { t } from 'i18next';
import { Input } from '@/shared/components/data-entry/input';
import type { EthKVStoreKeyValues } from '@/modules/smart-contracts/EthKVStore/config';
import {
  EthKVStoreKeys,
  Role,
} from '@/modules/smart-contracts/EthKVStore/config';
import { Select } from '@/shared/components/data-entry/select';
import { MultiSelect } from '@/shared/components/data-entry/multi-select';
import { JOB_TYPES } from '@/shared/consts';
import type { GetEthKVStoreValuesSuccessResponse } from '@/modules/operator/hooks/use-get-keys';
import { PercentsInputMask } from '@/shared/components/data-entry/input-masks';
import { sortFormKeys, STORE_KEYS_ORDER } from '../../utils';

const OPTIONS = [
  Role.EXCHANGE_ORACLE,
  Role.JOB_LAUNCHER,
  Role.RECORDING_ORACLE,
];

const formInputsConfig: Record<EthKVStoreKeyValues, React.ReactElement> = {
  [EthKVStoreKeys.Fee]: (
    <Input
      fullWidth
      label={t('operator.addKeysPage.existingKeys.fee')}
      mask={PercentsInputMask}
      name={EthKVStoreKeys.Fee}
    />
  ),
  [EthKVStoreKeys.PublicKey]: (
    <Input
      fullWidth
      label={t('operator.addKeysPage.existingKeys.publicKey')}
      name={EthKVStoreKeys.PublicKey}
    />
  ),
  [EthKVStoreKeys.Url]: (
    <Input
      fullWidth
      label={t('operator.addKeysPage.existingKeys.url')}
      name={EthKVStoreKeys.Url}
    />
  ),
  [EthKVStoreKeys.WebhookUrl]: (
    <Input
      fullWidth
      label={t('operator.addKeysPage.existingKeys.webhookUrl')}
      name={EthKVStoreKeys.WebhookUrl}
    />
  ),
  [EthKVStoreKeys.Role]: (
    <Select
      isChipRenderValue
      label={t('operator.addKeysPage.existingKeys.role')}
      name={EthKVStoreKeys.Role}
      options={OPTIONS.map((role, i) => ({
        name: role,
        value: role,
        id: i,
      }))}
    />
  ),
  [EthKVStoreKeys.JobTypes]: (
    <MultiSelect
      label={t('operator.addKeysPage.existingKeys.jobType')}
      name={EthKVStoreKeys.JobTypes}
      options={JOB_TYPES.map((jobType) => ({
        label: jobType,
        value: jobType,
      }))}
    />
  ),
};

export function EditPendingKeysForm({
  existingKeysInitialState,
}: Readonly<{
  existingKeysInitialState: GetEthKVStoreValuesSuccessResponse;
}>) {
  const sortedKeys = sortFormKeys(
    Object.keys(existingKeysInitialState) as EthKVStoreKeyValues[],
    STORE_KEYS_ORDER
  );

  return (
    <Grid container sx={{ flexDirection: 'column', gap: '1rem' }}>
      <Typography variant="body4">
        {t('operator.addKeysPage.pendingKeys.title')}
      </Typography>
      <Grid container sx={{ flexDirection: 'column', gap: '2rem' }}>
        {sortedKeys.map((key) => {
          const formInputsConfigKey = key;
          return (
            <>
              {!existingKeysInitialState[formInputsConfigKey]
                ? formInputsConfig[formInputsConfigKey]
                : null}
            </>
          );
        })}
      </Grid>
    </Grid>
  );
}

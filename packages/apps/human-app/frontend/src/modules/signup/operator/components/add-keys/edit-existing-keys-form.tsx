import { Grid, Typography } from '@mui/material';
import { t } from 'i18next';
import { useFormState } from 'react-hook-form';
import type { CustomButtonProps } from '@/shared/components/ui/button';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/data-entry/input';
import type { EthKVStoreKeyValues } from '@/modules/smart-contracts/EthKVStore/config';
import {
  EthKVStoreKeys,
  OPERATOR_ROLES,
} from '@/modules/smart-contracts/EthKVStore/config';
import { Select } from '@/shared/components/data-entry/select';
import { MultiSelect } from '@/shared/components/data-entry/multi-select';
import { JOB_TYPES } from '@/shared/consts';
import type { GetEthKVStoreValuesSuccessResponse } from '@/modules/operator/hooks/use-get-keys';
import { useColorMode } from '@/shared/contexts/color-mode';
import { PercentsInputMask } from '@/shared/components/data-entry/input-masks';
import { sortFormKeys, STORE_KEYS_ORDER } from '../../utils';

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
      options={OPERATOR_ROLES.map((role, i) => ({
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

export function EditExistingKeysForm({
  existingKeysInitialState,
  formButtonProps,
}: Readonly<{
  existingKeysInitialState: GetEthKVStoreValuesSuccessResponse;
  formButtonProps: CustomButtonProps;
}>) {
  const { colorPalette } = useColorMode();
  const { errors } = useFormState();
  const noChangesError = errors.form?.message as string;

  const sortedKeys = sortFormKeys(
    Object.keys(existingKeysInitialState) as EthKVStoreKeyValues[],
    STORE_KEYS_ORDER
  );

  return (
    <Grid container sx={{ flexDirection: 'column', gap: '1rem' }}>
      <Typography variant="body4">
        {t('operator.addKeysPage.existingKeys.title')}
      </Typography>
      <Grid container sx={{ flexDirection: 'column', gap: '2rem' }}>
        {sortedKeys.map((key) => {
          const formInputsConfigKey = key;
          return (
            <>
              {existingKeysInitialState[formInputsConfigKey] ? (
                <span key={key}>{formInputsConfig[formInputsConfigKey]}</span>
              ) : null}
            </>
          );
        })}

        {noChangesError ? (
          <div>
            <Typography
              color={colorPalette.error.main}
              component="div"
              variant="helperText"
            >
              {noChangesError}
            </Typography>
          </div>
        ) : null}
        <div>
          <Button {...formButtonProps}>
            <Typography color={colorPalette.white} variant="buttonMedium">
              {t('operator.addKeysPage.editKeysForm.btn')}
            </Typography>
          </Button>
        </div>
      </Grid>
    </Grid>
  );
}

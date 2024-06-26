/* eslint-disable camelcase -- ....*/
import { Grid, Typography } from '@mui/material';
import { t } from 'i18next';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { colorPalette } from '@/styles/color-palette';
import type { EthKVStoreKeyValues } from '@/smart-contracts/EthKVStore/config';
import { EthKVStoreKeys } from '@/smart-contracts/EthKVStore/config';
import { OptionalText } from '@/components/ui/optional-text';
import { EmptyPlaceholder } from '@/components/ui/empty-placeholder';
import type { GetEthKVStoreValuesSuccessResponse } from '@/api/servieces/operator/get-keys';
import { Chips } from '@/components/ui/chips';
import { Chip } from '@/components/ui/chip';
import {
  order,
  sortFormKeys,
} from '@/pages/operator/sign-up/add-keys/sort-form';

const existingKeysConfig: Record<
  EthKVStoreKeyValues,
  (values: GetEthKVStoreValuesSuccessResponse) => React.ReactElement
> = {
  [EthKVStoreKeys.Fee]: ({ fee }) => (
    <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
      <Typography variant="subtitle2">
        {t('operator.addKeysPage.existingKeys.fee')}
      </Typography>
      <Typography variant="body1">
        <OptionalText text={fee?.toString() + t('inputMasks.percentSuffix')} />
      </Typography>
    </Grid>
  ),
  [EthKVStoreKeys.PublicKey]: ({ public_key }) => (
    <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
      <Typography variant="subtitle2" width="100%">
        {t('operator.addKeysPage.existingKeys.publicKey')}
      </Typography>
      <Typography variant="body1" width="100%">
        <OptionalText text={public_key} />
      </Typography>
    </Grid>
  ),
  [EthKVStoreKeys.Url]: ({ url }) => (
    <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
      <Typography variant="subtitle2" width="100%">
        {t('operator.addKeysPage.existingKeys.url')}
      </Typography>
      <Typography variant="body1" width="100%">
        <OptionalText text={url} />
      </Typography>
    </Grid>
  ),
  [EthKVStoreKeys.WebhookUrl]: ({ webhook_url }) => (
    <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
      <Typography variant="subtitle2" width="100%">
        {t('operator.addKeysPage.existingKeys.webhookUrl')}
      </Typography>
      <Typography variant="body1" width="100%">
        <OptionalText text={webhook_url} />
      </Typography>
    </Grid>
  ),
  [EthKVStoreKeys.Role]: ({ role }) => (
    <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
      <Typography variant="subtitle2" width="100%">
        {t('operator.addKeysPage.existingKeys.role')}
      </Typography>
      <div>{role ? <Chip label={role} /> : <EmptyPlaceholder />}</div>
    </Grid>
  ),
  [EthKVStoreKeys.JobTypes]: ({ job_types }) => (
    <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
      <Typography variant="subtitle2" width="100%">
        {t('operator.addKeysPage.existingKeys.jobType')}
      </Typography>
      <div>{job_types ? <Chips data={job_types} /> : <EmptyPlaceholder />}</div>
    </Grid>
  ),
};

export function ExistingKeys({
  openEditMode,
  existingKeysInitialState,
}: {
  openEditMode: () => void;
  existingKeysInitialState: GetEthKVStoreValuesSuccessResponse;
}) {
  const { getValues } = useFormContext<GetEthKVStoreValuesSuccessResponse>();
  const formValues = getValues();

  const sortedKeys = sortFormKeys(
    Object.keys(existingKeysInitialState) as EthKVStoreKeyValues[],
    order
  );

  return (
    <Grid container sx={{ flexDirection: 'column', gap: '2rem' }}>
      <Typography variant="body4">
        {t('operator.addKeysPage.existingKeys.title')}
      </Typography>
      {sortedKeys.map((key) => {
        const existingKeysConfigKey = key as EthKVStoreKeyValues;
        return existingKeysInitialState[existingKeysConfigKey]
          ? existingKeysConfig[existingKeysConfigKey](formValues)
          : null;
      })}
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

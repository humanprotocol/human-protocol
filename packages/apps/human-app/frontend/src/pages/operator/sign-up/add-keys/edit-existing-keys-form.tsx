import { Grid, Typography } from '@mui/material';
import { t } from 'i18next';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { colorPalette } from '@/styles/color-palette';
import { Input } from '@/components/data-entry/input';
import { EthKVStoreKeys, Role } from '@/smart-contracts/EthKVStore/config';
import { Select } from '@/components/data-entry/select';

const OPTIONS = [Role.ExchangeOracle, Role.JobLauncher, Role.RecordingOracle];

export function EditExistingKeysForm({
  closeEditMode,
}: {
  closeEditMode: () => void;
}) {
  const { trigger } = useFormContext();

  const save = async () => {
    const valid = await trigger();

    if (valid) {
      closeEditMode();
    }
  };

  return (
    <>
      <Typography variant="body4">
        {t('operator.addKeysPage.existingKeys.title')}
      </Typography>
      <Grid container sx={{ flexDirection: 'column', gap: '2rem' }}>
        <Input
          fullWidth
          label={t('operator.addKeysPage.existingKeys.fee')}
          mask="PercentsInputMask"
          name={EthKVStoreKeys.Fee}
        />
        <Input
          fullWidth
          label={t('operator.addKeysPage.existingKeys.publicKey')}
          name={EthKVStoreKeys.PublicKey}
        />
        <Input
          fullWidth
          label={t('operator.addKeysPage.existingKeys.webhookUrl')}
          name={EthKVStoreKeys.WebhookUrl}
        />
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
        <div>
          <Button
            onClick={() => {
              void save();
            }}
            variant="contained"
          >
            <Typography color={colorPalette.white} variant="buttonMedium">
              {t('operator.addKeysPage.editKeysForm.btn')}
            </Typography>
          </Button>
        </div>
      </Grid>
    </>
  );
}

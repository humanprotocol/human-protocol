import { Grid, Typography } from '@mui/material';
import { t } from 'i18next';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { colorPalette } from '@/styles/color-palette';
import { Input } from '@/components/data-entry/input';
import { EthKVStoreKeys, Role } from '@/smart-contracts/EthKVStore/config';
import { Select } from '@/components/data-entry/select';

const OPTIONS = [
  Role.ExchangeOracle,
  Role.JobLauncher,
  Role.RecordingOracle,
  Role.ReputationOracle,
];

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
    <Grid container sx={{ flexDirection: 'column', gap: '2rem' }}>
      <Input
        fullWidth
        label={EthKVStoreKeys.Fee}
        mask="PercentsInputMask"
        name={EthKVStoreKeys.Fee}
      />
      <Input
        fullWidth
        label={EthKVStoreKeys.PublicKey}
        name={EthKVStoreKeys.PublicKey}
      />
      <Input
        fullWidth
        label={EthKVStoreKeys.WebhookUrl}
        name={EthKVStoreKeys.WebhookUrl}
      />
      <Select
        isChipRenderValue
        label={EthKVStoreKeys.Role}
        name={EthKVStoreKeys.Role}
        options={OPTIONS.map((role, i) => ({ name: role, value: role, id: i }))}
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
  );
}

import { Grid, Typography } from '@mui/material';
import { t } from 'i18next';
import { Button } from '@/components/ui/button';
import { colorPalette } from '@/styles/color-palette';
import type { UseFormResult } from '@/pages/operator/sign-up/add-keys/add-keys.page';
import { Input } from '@/components/data-entry/input';
import { MultiSelect } from '@/components/data-entry/multi-select';
import { PercentsInputMask } from '@/components/data-entry/input-masks';

export function EditKeysForm({
  closeEditMode,
  useFormResult,
}: {
  useFormResult: UseFormResult;
  closeEditMode: () => void;
}) {
  const { watch, getValues, trigger, formState } = useFormResult;
  watch(['jobTypes']);
  const jobTypes = getValues('jobTypes');

  const save = async () => {
    await trigger();
    if (formState.isValid) {
      closeEditMode();
    }
  };

  return (
    <Grid container sx={{ flexDirection: 'column', gap: '2rem' }}>
      <Input
        fullWidth
        label={t('operator.addKeysPage.editKeysForm.fee')}
        mask={PercentsInputMask}
        name="fee"
      />
      <Input
        fullWidth
        label={t('operator.addKeysPage.editKeysForm.webhookUrl')}
        name="webhookUrl"
      />
      <MultiSelect
        label={t('operator.addKeysPage.editKeysForm.jobTypes')}
        name="jobTypes"
        options={jobTypes}
      />
      <div>
        <Button
          fullWidth={false}
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

import { Grid, Typography } from '@mui/material';
import { t } from 'i18next';
import { Button } from '@/components/ui/button';
import { colorPalette } from '@/styles/color-palette';
import type { UseFormResult } from '@/pages/operator/sign-up/add-keys/add-keys.page';
import { Input } from '@/components/data-entry/input';
import { MultiSelect } from '@/components/data-entry/multi-select';

const JOB_TYPES_OPTIONS = ['Image Labelling', 'BBox', 'Testing'];

export function EditExistingKeysForm({
  closeEditMode,
  useFormResult,
}: {
  useFormResult: UseFormResult;
  closeEditMode: () => void;
}) {
  const { trigger } = useFormResult;

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
        label={t('operator.addKeysPage.editKeysForm.fee')}
        mask="PercentsInputMask"
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
        options={JOB_TYPES_OPTIONS}
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

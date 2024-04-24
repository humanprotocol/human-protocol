import { Grid, Typography } from '@mui/material';
import { t } from 'i18next';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import { Chips } from '@/components/ui/chips';
import { Button } from '@/components/ui/button';
import { colorPalette } from '@/styles/color-palette';
import type { UseFormResult } from '@/pages/operator/sign-up/add-keys/add-keys.page';

export function ExistingKeys({
  openEditMode,
  useFormResult,
}: {
  useFormResult: UseFormResult;
  openEditMode: () => void;
}) {
  const { watch, getValues } = useFormResult;
  watch(['fee', 'jobTypes', 'webhookUrl']);
  const fee = getValues('fee');
  const jobTypes = getValues('jobTypes');
  const webhookUrl = getValues('webhookUrl');

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
          {fee}
          {t('inputMasks.percentSuffix')}
        </Typography>
      </Grid>
      <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
        <Typography variant="subtitle2">
          {t('operator.addKeysPage.existingKeys.webhookUrl')}
        </Typography>
        <Typography variant="body1">{webhookUrl}</Typography>
      </Grid>
      <Grid container sx={{ flexDirection: 'column', gap: '0.75rem' }}>
        <Typography variant="subtitle2">
          {t('operator.addKeysPage.existingKeys.jobTypes')}
        </Typography>
        <Chips data={jobTypes} />
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

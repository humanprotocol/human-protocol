import { useTranslation } from 'react-i18next';
import { Stack, Typography } from '@mui/material';
import { Chip } from '@/shared/components/ui/chip';
import { useWorkerIdentityVerificationStatus } from '../hooks';
import { KycStatus } from '../types';
import { StartIdvBtn } from './buttons';

const getChipColor = (status: KycStatus) => {
  if (status === KycStatus.APPROVED) {
    return 'success.main';
  } else if (
    [KycStatus.RESUBMISSION_REQUESTED, KycStatus.REVIEW].includes(status)
  ) {
    return 'warning.main';
  }
  return 'error.main';
};

export function IdentityVerificationControl() {
  const { t } = useTranslation();
  const { status } = useWorkerIdentityVerificationStatus();

  const label = t(`worker.profile.idvStatusValues.${status}`);

  if (status === KycStatus.NONE) {
    return <StartIdvBtn />;
  }

  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <Typography variant="buttonLarge">
        {t('worker.profile.identityVerificationStatus')}:{' '}
      </Typography>
      <Chip label={label} backgroundColor={getChipColor(status)} />
    </Stack>
  );
}

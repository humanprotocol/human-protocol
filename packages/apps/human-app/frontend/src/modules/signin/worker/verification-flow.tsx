import { useCallback, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { t } from 'i18next';

import { Chip } from '@/shared/components/ui/chip';
import { useColorMode } from '@/shared/contexts/color-mode/use-color-mode';
import {
  IdentityVerificationControl,
  WalletConnectionControl,
} from '@/modules/worker/profile/components';
import { useWorkerIdentityVerificationStatus } from '@/modules/worker/profile/hooks';
import { KycStatus } from '@/modules/worker/profile/types/profile-types';
import { useIsMobile } from '@/shared/hooks';

type VerificationStep = 'kyc' | 'wallet';

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

export function VerificationFlow({
  isKycApproved,
}: {
  isKycApproved: boolean;
}) {
  const [step, setStep] = useState<VerificationStep>(
    isKycApproved ? 'wallet' : 'kyc'
  );

  const { colorPalette } = useColorMode();
  const { status } = useWorkerIdentityVerificationStatus();
  const isMobile = useIsMobile();

  const label = t(`worker.profile.idvStatusValues.${status}`);
  const isKycDeclined = status === KycStatus.DECLINED;
  const isKycStarted = status !== KycStatus.NONE;

  const handleKycApproved = useCallback(() => {
    setStep('wallet');
  }, []);

  return (
    <Stack sx={{ mt: { xs: 3, md: 0 }, px: 2, width: 400 }}>
      <Typography
        variant="h4"
        sx={{ color: colorPalette.text.auxiliary100, mb: { xs: 2.5, md: 5 } }}
      >
        {t('worker.profile.beforeWeGetStarted')}
      </Typography>
      <Stack
        direction="row"
        sx={{ display: isKycDeclined ? 'none' : 'flex', gap: 1, mb: 2 }}
      >
        <Box
          sx={{
            width: 90,
            height: 10,
            borderRadius: '7px',
            bgcolor: colorPalette.primary.main,
          }}
        />
        <Box
          sx={{
            width: 90,
            height: 10,
            borderRadius: '7px',
            bgcolor:
              step === 'wallet'
                ? colorPalette.primary.main
                : colorPalette.background.default,
          }}
        />
      </Stack>
      {step === 'kyc' && (
        <>
          <Typography
            component="h6"
            variant={isMobile ? 'body1' : 'h6'}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: colorPalette.text.auxiliary100,
              fontWeight: 600,
              mb: { xs: 3, md: 2 },
            }}
          >
            {t('worker.profile.identityVerification')}
            {isKycStarted && (
              <Chip label={label} backgroundColor={getChipColor(status)} />
            )}
          </Typography>
          <IdentityVerificationControl
            kycStatus={status}
            onKycApproved={handleKycApproved}
          />
        </>
      )}
      {step === 'wallet' && (
        <>
          <Typography
            component="h6"
            variant={isMobile ? 'body1' : 'h6'}
            sx={{
              color: colorPalette.text.auxiliary100,
              fontWeight: 600,
              mb: { xs: 3, md: 5 },
            }}
          >
            {t('worker.profile.connectYourWallet')}
          </Typography>
          <WalletConnectionControl />
        </>
      )}
    </Stack>
  );
}

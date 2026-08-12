import { useCallback, useState } from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { t } from 'i18next';

import {
  IdentityVerificationControl,
  WalletConnectionControl,
} from '@/modules/worker/profile/components';
import { KycStatus } from '@/modules/worker/profile/types/profile-types';
import { useIsMobile } from '@/shared/hooks';
import { useAuth } from '@/modules/auth/hooks/use-auth';

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

  const { user } = useAuth();
  const isMobile = useIsMobile();

  const kycStatus = user?.kyc_status as KycStatus;

  const label = kycStatus
    ? t(`worker.profile.idvStatusValues.${kycStatus}`)
    : '';
  const isKycDeclined = kycStatus === KycStatus.DECLINED;
  const isKycStarted = kycStatus !== KycStatus.NONE;

  const handleKycApproved = useCallback(() => {
    setStep('wallet');
  }, []);

  return (
    <Stack sx={{ mt: { xs: 3, md: 0 }, px: 2, width: 400 }}>
      <Typography
        variant="h4"
        sx={{ color: 'text.auxiliary100', mb: { xs: 2.5, md: 5 } }}
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
            bgcolor: 'primary.main',
          }}
        />
        <Box
          sx={{
            width: 90,
            height: 10,
            borderRadius: '7px',
            bgcolor: step === 'wallet' ? 'primary.main' : 'background.default',
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
              color: 'text.auxiliary100',
              fontWeight: 600,
              mb: { xs: 3, md: 2 },
            }}
          >
            {t('worker.profile.identityVerification')}
            {isKycStarted && label && (
              <Chip
                label={label}
                sx={{
                  bgcolor: getChipColor(kycStatus),
                  border: 'none',
                  color: 'common.white',
                }}
              />
            )}
          </Typography>
          <IdentityVerificationControl
            kycStatus={kycStatus}
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
              color: 'text.auxiliary100',
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

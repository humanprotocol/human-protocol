import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Box, keyframes, Link, Stack, Typography } from '@mui/material';
import { jwtDecode } from 'jwt-decode';

import { useStartIdv } from '../hooks/use-start-idv';
import { KycStatus } from '@/shared/types/entity.type';
import { env } from '@/shared/env';
import { HourglassIcon, VeriffIcon } from '@/shared/components/ui/icons';
import { Button } from '@/shared/components/ui/button';
import { useAccessTokenRefresh } from '@/api/hooks/use-access-token-refresh';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import { UserData } from '@/modules/auth/context/auth-context';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { useColorMode } from '@/shared/contexts/color-mode/use-color-mode';

const hourglassSpin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  45% {
    transform: rotate(180deg);
  }
  55% {
    transform: rotate(180deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const CHECK_STATUS_COOLDOWN_TIME = 30000;

export function IdentityVerificationControl({
  kycStatus,
  onKycApproved,
}: {
  kycStatus: KycStatus;
  onKycApproved: () => void;
}) {
  const [isCheckStatusCoolingDown, setIsCheckStatusCoolingDown] =
    useState(false);

  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { t } = useTranslation();
  const { isDarkMode } = useColorMode();

  const { isIdvAlreadyInProgress, idvStarted, idvStartIsPending, startIdv } =
    useStartIdv();
  const {
    mutateAsync: refreshAccessTokenAsync,
    isPending: isRefreshingAccessToken,
  } = useAccessTokenRefresh();
  const { updateUserData } = useAuth();

  const handleCheckVerificationStatus = useCallback(async () => {
    if (isRefreshingAccessToken || isCheckStatusCoolingDown) {
      return;
    }

    setIsCheckStatusCoolingDown(true);
    cooldownTimerRef.current = setTimeout(() => {
      setIsCheckStatusCoolingDown(false);
      cooldownTimerRef.current = null;
    }, CHECK_STATUS_COOLDOWN_TIME);

    try {
      await refreshAccessTokenAsync({});
      const accessToken = browserAuthProvider.getAccessToken();

      if (!accessToken) {
        return;
      }

      const userData = jwtDecode<UserData>(accessToken);

      if (!!userData.kyc_status && kycStatus !== userData.kyc_status) {
        updateUserData(userData);
      }

      if (userData.kyc_status === KycStatus.APPROVED) {
        onKycApproved();
      }
    } catch (error) {
      console.error(error);
    }
  }, [
    onKycApproved,
    refreshAccessTokenAsync,
    updateUserData,
    kycStatus,
    isRefreshingAccessToken,
    isCheckStatusCoolingDown,
  ]);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    };
  }, []);

  if (kycStatus === KycStatus.DECLINED) {
    return (
      <Typography
        variant="body1"
        sx={{ color: isDarkMode ? 'text.auxiliary100' : 'text.auxiliary200' }}
      >
        <Trans
          components={{
            1: <Link href={`mailto:${env.VITE_HUMAN_SUPPORT_EMAIL}`} />,
          }}
          i18nKey="verifyUser.verificationDeclined"
        />
      </Typography>
    );
  }

  if (
    (isIdvAlreadyInProgress || idvStarted) &&
    kycStatus !== KycStatus.RESUBMISSION_REQUESTED
  ) {
    return (
      <>
        <Stack
          sx={{
            width: '100%',
            p: 2.5,
            borderRadius: '10px',
            border: '1px solid',
            borderColor: 'border.main',
          }}
        >
          <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
            {t('verifyUser.verificationOpenedInNewTab')}
          </Typography>
          <Typography
            variant="body4"
            sx={{
              color: 'text.auxiliary200',
              mb: 2,
            }}
          >
            {t('verifyUser.completeYourVerification')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'inline-flex',
                animation: `${hourglassSpin} 1.4s ease-in-out infinite`,
                transformOrigin: 'center',
              }}
            >
              <HourglassIcon />
            </Box>
            <Typography
              variant="body4"
              sx={{
                color: 'text.auxiliary200',
                fontStyle: 'italic',
              }}
            >
              {t('verifyUser.waitingForVerification')}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" sx={{ mt: 3, gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            color="accent"
            fullWidth
            loading={isRefreshingAccessToken}
            onClick={handleCheckVerificationStatus}
          >
            {t('verifyUser.checkVerificationStatus')}
          </Button>
        </Stack>
      </>
    );
  }

  return (
    <Stack>
      <Typography
        variant="body4"
        sx={{ color: 'text.auxiliary200', mb: { xs: 3, md: 5 } }}
      >
        {t('verifyUser.veriffCopy')}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          mb: { xs: 1, md: 1.5 },
          gap: 0.5,
        }}
      >
        <Typography
          component="span"
          variant="body5"
          sx={{ color: isDarkMode ? 'text.auxiliary100' : 'text.auxiliary200' }}
        >
          {t('verifyUser.poweredBy')}
        </Typography>
        <VeriffIcon />
      </Box>
      <Button
        variant="contained"
        color="accent"
        fullWidth
        loading={idvStartIsPending}
        onClick={startIdv}
      >
        {t('verifyUser.completeIdentityVerification')}
      </Button>
    </Stack>
  );
}

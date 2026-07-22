import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Box, keyframes, Link, Stack, Typography } from '@mui/material';
import { jwtDecode } from 'jwt-decode';

import { useStartIdv } from '../hooks';
import { KycStatus } from '../types';
import { useColorMode } from '@/shared/contexts/color-mode';
import { env } from '@/shared/env';
import { HourglassIcon, VeriffIcon } from '@/shared/components/ui/icons';
import { Button } from '@/shared/components/ui/button';
import { useAccessTokenRefresh } from '@/api/hooks/use-access-token-refresh';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import { UserData } from '@/modules/auth/context/auth-context';
import { useAuth } from '@/modules/auth/hooks/use-auth';

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

const CHECK_STATUS_COOLDOWN_TIME = 10000;

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
  const { isIdvAlreadyInProgress, idvStarted, idvStartIsPending, startIdv } =
    useStartIdv();
  const { refreshAccessTokenAsync, isRefreshingAccessToken } =
    useAccessTokenRefresh();
  const { updateUserData } = useAuth();
  const { colorPalette } = useColorMode();

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
      await refreshAccessTokenAsync({ authType: 'web2' });
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
        sx={{ color: colorPalette.text.auxiliary200 }}
      >
        <Trans
          components={{
            1: <Link href={`mailto:${env.VITE_HUMAN_SUPPORT_EMAIL}`} />,
          }}
          i18nKey="worker.profile.verificationDeclined"
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
            borderColor: colorPalette.border.main,
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: colorPalette.text.primary, fontWeight: 600, mb: 1 }}
          >
            {t('worker.profile.verificationOpenedInNewTab')}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: colorPalette.text.auxiliary200,
              fontWeight: 400,
              mb: 2,
            }}
          >
            {t('worker.profile.completeYourVerification')}
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
              variant="body1"
              sx={{
                color: colorPalette.text.auxiliary200,
                fontWeight: 400,
                fontStyle: 'italic',
              }}
            >
              {t('worker.profile.waitingForVerification')}
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
            {t('worker.profile.checkVerificationStatus')}
          </Button>
        </Stack>
      </>
    );
  }

  return (
    <Stack>
      <Typography
        variant="body1"
        sx={{ color: colorPalette.text.auxiliary200, mb: { xs: 3, md: 5 } }}
      >
        {t('worker.profile.veriffCopy')}
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
          sx={{
            color: colorPalette.text.auxiliary200,
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: 0.15,
            lineHeight: '150%',
          }}
        >
          {t('worker.profile.poweredBy')}
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
        {t('worker.profile.completeIdentityVerification')}
      </Button>
    </Stack>
  );
}

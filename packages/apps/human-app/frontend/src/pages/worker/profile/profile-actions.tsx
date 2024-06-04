import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileAction } from '@/pages/worker/profile/profile-action';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { useWalletConnect } from '@/hooks/use-wallet-connect';
import { ConnectWalletBtn } from '@/components/ui/connect-wallet-btn';
import { useKycSessionIdMutation } from '@/api/servieces/worker/get-kyc-session-id';
import { useProtectedLayoutNotification } from '@/hooks/use-protected-layout-notifications';
import { Button } from '@/components/ui/button';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { routerPaths } from '@/router/router-paths';
import { startSynapsKyc } from '@/pages/worker/profile/start-synaps-kyc';
import { RegisterAddressAction } from '@/pages/worker/profile/register-address-action';
import { RequireWalletConnect } from '@/auth-web3/require-wallet-connect';

export function ProfileActions({
  setNotifications,
}: {
  setNotifications: () => void;
}) {
  const navigation = useNavigate();
  const { setTopNotification } = useProtectedLayoutNotification();
  const {
    data: kycSessionIdData,
    mutate: kycSessionIdMutation,
    error: kycSessionIdMutationError,
    isPending: kycSessionIdIsPending,
  } = useKycSessionIdMutation({
    onError: () => {
      setTopNotification({
        type: 'warning',
        content: defaultErrorMessage(kycSessionIdMutationError),
      });
    },
  });

  const { user } = useAuthenticatedUser();
  const { t } = useTranslation();
  const { isConnected: isWalletConnected } = useWalletConnect();
  const emailVerified =
    Boolean(kycSessionIdData?.session_id) ||
    kycSessionIdData?.error !== 'emailNotVerified';
  const kycApproved =
    user.kyc_status === 'APPROVED' || kycSessionIdData?.error === 'kycApproved';

  useEffect(() => {
    if (user.kyc_status !== 'APPROVED') {
      kycSessionIdMutation();
    }
  }, [kycSessionIdMutation, user.kyc_status]);

  useEffect(() => {
    setNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- correct dependency
  }, [isWalletConnected]);

  return (
    <Grid container flexDirection="column" gap="1rem">
      <Grid>
        {!emailVerified && (
          <Button
            fullWidth
            onClick={() => {
              navigation(routerPaths.worker.sendEmailVerification, {
                state: { routerState: { email: user.email } },
              });
            }}
            variant="contained"
          >
            {t('worker.profile.confirmEmail')}
          </Button>
        )}
      </Grid>
      <Grid>
        <ProfileAction
          done={user.kyc_status === 'APPROVED' && emailVerified}
          doneLabel={t('worker.profile.kycCompleted')}
          toDoComponent={
            <Button
              disabled={!emailVerified}
              fullWidth
              loading={kycSessionIdIsPending}
              onClick={() => {
                if (kycSessionIdData?.session_id) {
                  startSynapsKyc(kycSessionIdData.session_id);
                }
              }}
              variant="contained"
            >
              {t('worker.profile.completeKYC')}
            </Button>
          }
        />
      </Grid>
      <Grid>
        <ProfileAction
          done={Boolean(isWalletConnected && kycApproved)}
          doneLabel={t('worker.profile.walletConnected')}
          toDoComponent={
            <ConnectWalletBtn
              disabled={user.kyc_status !== 'APPROVED'}
              fullWidth
              variant="contained"
            >
              {t('worker.profile.connectWallet')}
            </ConnectWalletBtn>
          }
        />
      </Grid>
      <Grid>
        {isWalletConnected && kycApproved ? (
          <RequireWalletConnect>
            <RegisterAddressAction kycApproved={kycApproved} />
          </RequireWalletConnect>
        ) : (
          <Button disabled fullWidth>
            {t('worker.profile.addKYCInfoOnChain')}
          </Button>
        )}
      </Grid>
    </Grid>
  );
}

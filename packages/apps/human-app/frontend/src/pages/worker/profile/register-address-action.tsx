import { t } from 'i18next';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useWalletConnect } from '@/hooks/use-wallet-connect';
import { ProfileAction } from '@/pages/worker/profile/profile-action';
import { RegisterAddress } from '@/pages/worker/profile/register-address-btn';
import { useProtectedLayoutNotification } from '@/hooks/use-protected-layout-notifications';
import { useGetOnChainRegisteredAddress } from '@/api/servieces/worker/get-on-chain-registered-address';

export function RegisterAddressAction({
  kycApproved,
}: {
  kycApproved: boolean;
}) {
  const { setTopNotification, closeNotification } =
    useProtectedLayoutNotification();

  const {
    data: registerAddressData,
    isError: isRegisterAddressError,
    isPending: isRegisterAddressPending,
    status: registerAddressStatus,
  } = useGetOnChainRegisteredAddress();
  const { isConnected } = useWalletConnect();

  useEffect(() => {
    if (
      !registerAddressData?.registeredAddressOnChain &&
      registerAddressStatus === 'success'
    ) {
      setTopNotification({
        content: t('worker.profile.topNotifications.noKYCOnChain'),
        type: 'warning',
      });
    } else {
      closeNotification();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ...
  }, [registerAddressData, registerAddressStatus]);

  if (isRegisterAddressPending) {
    return (
      <Button fullWidth loading>
        {t('worker.profile.addKYCInfoOnChain')}
      </Button>
    );
  }

  if (isRegisterAddressError) {
    return (
      <Button disabled fullWidth>
        {t('worker.profile.addKYCInfoOnChain')}
      </Button>
    );
  }

  return (
    <ProfileAction
      done={Boolean(registerAddressData.registeredAddressOnChain)}
      doneLabel={t('worker.profile.kycInfoOnChainAdded')}
      toDoComponent={
        <RegisterAddress disabled={!(isConnected && kycApproved)} />
      }
    />
  );
}

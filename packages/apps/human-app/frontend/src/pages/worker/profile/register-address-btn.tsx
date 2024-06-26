import { t } from 'i18next';
import { Button } from '@/components/ui/button';
import { useRegisterAddress } from '@/api/servieces/worker/use-register-address';
import { useRegisterAddressNotifications } from '@/hooks/use-register-address-notifications';
import { useGetOnChainRegisteredAddress } from '@/api/servieces/worker/get-on-chain-registered-address';

export function RegisterAddress({ disabled }: { disabled: boolean }) {
  const { onSuccess, onError } = useRegisterAddressNotifications();
  const {
    refetch: refetchKVStoreAddressData,
    isPending: isKVStoreAddressDataPending,
  } = useGetOnChainRegisteredAddress();
  const { mutate, isPending } = useRegisterAddress({
    onError,
    onSuccess: () => {
      void refetchKVStoreAddressData();
      onSuccess();
    },
  });

  return (
    <Button
      disabled={disabled}
      fullWidth
      loading={isPending || isKVStoreAddressDataPending}
      onClick={mutate.bind(undefined, undefined)}
      variant="contained"
    >
      {t('worker.profile.addKYCInfoOnChain')}
    </Button>
  );
}

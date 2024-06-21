import { t } from 'i18next';
import { Button } from '@/components/ui/button';
import { useRegisterAddress } from '@/api/servieces/worker/use-register-address';
import { useRegisterAddressNotifications } from '@/hooks/use-register-address-notifications';

export function RegisterAddress({ disabled }: { disabled: boolean }) {
  const { onSuccess, onError } = useRegisterAddressNotifications();
  const { mutate, isPending } = useRegisterAddress({
    onError,
    onSuccess,
  });

  return (
    <Button
      disabled={disabled}
      fullWidth
      loading={isPending}
      onClick={mutate.bind(undefined, undefined)}
      variant="contained"
    >
      {t('worker.profile.addKYCInfoOnChain')}
    </Button>
  );
}

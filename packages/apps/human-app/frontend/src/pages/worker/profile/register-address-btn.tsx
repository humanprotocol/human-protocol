import { t } from 'i18next';
import { Button } from '@/components/ui/button';
import { useRegisterAddressMutation } from '@/api/servieces/worker/use-register-address';
import { useRegisterAddressNotifications } from '@/hooks/use-register-address-notifications';

export function RegisterAddressBtn() {
  const { onSuccess, onError } = useRegisterAddressNotifications();
  const { mutate, isPending } = useRegisterAddressMutation({
    onError,
    onSuccess,
  });

  return (
    <Button
      fullWidth
      loading={isPending}
      onClick={mutate.bind(undefined, undefined)}
      variant="contained"
    >
      {t('worker.profile.registerAddress')}
    </Button>
  );
}

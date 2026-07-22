import { t } from 'i18next';
import { Button } from '@/shared/components/ui/button';
import { useRegisterAddress } from '@/modules/worker/hooks/use-register-address';
import { useRegisterAddressNotifications } from '@/modules/worker/hooks/use-register-address-notifications';

export function RegisterAddressBtn() {
  const { onSuccess, onError } = useRegisterAddressNotifications();
  const { mutate, isPending } = useRegisterAddress({
    onError,
    onSuccess,
  });

  return (
    <Button
      variant="contained"
      color="accent"
      fullWidth
      loading={isPending}
      onClick={mutate.bind(undefined, undefined)}
    >
      {t('worker.profile.registerAddress')}
    </Button>
  );
}

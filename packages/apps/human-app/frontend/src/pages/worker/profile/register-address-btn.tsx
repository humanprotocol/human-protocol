import { t } from 'i18next';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useProtectedLayoutNotification } from '@/hooks/use-protected-layout-notifications';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { jsonRpcErrorHandler } from '@/shared/helpers/json-rpc-error-handler';
import { useSetKycOnChain } from '@/api/servieces/worker/set-kyc-on-chain';

export function RegisterAddress({ disabled }: { disabled: boolean }) {
  const { closeNotification, setTopNotification } =
    useProtectedLayoutNotification();
  const { mutate, isPending, error, status } = useSetKycOnChain();

  useEffect(() => {
    if (status === 'success') {
      closeNotification();
      return;
    }
    if (status === 'error') {
      setTopNotification({
        type: 'warning',
        content: defaultErrorMessage(error, jsonRpcErrorHandler),
      });
    }
  }, [closeNotification, error, setTopNotification, status]);

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

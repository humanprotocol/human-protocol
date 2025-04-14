import { t } from 'i18next';
import { useEffect } from 'react';
import { useConnectedWallet } from '@/shared/contexts/wallet-connect';
import { Button } from '@/shared/components/ui/button';
import {
  TopNotificationType,
  useNotification,
  usePrepareSignature,
} from '@/shared/hooks';
import { PrepareSignatureType } from '@/shared/services/signature.service';
import { useEnableWeb3Operator } from '../hooks';

export function ProfileEnableButton() {
  const { signMessage } = useConnectedWallet();
  const {
    mutateAsync,
    error: signatureDataError,
    isPending: isSignatureDataPending,
  } = usePrepareSignature(PrepareSignatureType.ENABLE_OPERATOR);

  const {
    mutate: enableOperatorMutation,
    error: enableOperatorError,
    isPending: isEnableOperatorPending,
  } = useEnableWeb3Operator();

  const { showNotification } = useNotification();

  useEffect(() => {
    if (Boolean(signatureDataError) || Boolean(enableOperatorError)) {
      showNotification({
        message: t('operator.profile.activate.cannotActivate'),
        type: TopNotificationType.WARNING,
      });
    }
  }, [signatureDataError, enableOperatorError, showNotification]);

  const enableOperator = async () => {
    const signaturePayload = await mutateAsync();
    const signature = await signMessage(JSON.stringify(signaturePayload));
    enableOperatorMutation({ signature: signature ?? '' });
  };

  return (
    <Button
      loading={isSignatureDataPending || isEnableOperatorPending}
      onClick={() => {
        void enableOperator();
      }}
      variant="contained"
    >
      {t('operator.profile.activate.activateBtn')}
    </Button>
  );
}

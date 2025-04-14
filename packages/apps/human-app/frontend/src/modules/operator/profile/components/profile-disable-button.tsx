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
import { useDisableWeb3Operator } from '../hooks';

export function ProfileDisableButton() {
  const { signMessage } = useConnectedWallet();
  const {
    mutateAsync,
    isPending: isSignatureDataPending,
    error: signatureDataError,
  } = usePrepareSignature(PrepareSignatureType.DISABLE_OPERATOR);

  const {
    mutate: disableOperatorMutation,
    error: disableOperatorError,
    isPending: isDisableOperatorPending,
  } = useDisableWeb3Operator();

  const { showNotification } = useNotification();

  useEffect(() => {
    if (Boolean(signatureDataError) || Boolean(disableOperatorError)) {
      showNotification({
        message: t('operator.profile.disable.cannotDisable'),
        type: TopNotificationType.WARNING,
      });
    }
  }, [signatureDataError, disableOperatorError, showNotification]);

  const disableOperator = async () => {
    const signaturePayload = await mutateAsync();
    const signature = await signMessage(JSON.stringify(signaturePayload));
    disableOperatorMutation({ signature: signature ?? '' });
  };

  return (
    <Button
      loading={isSignatureDataPending || isDisableOperatorPending}
      onClick={() => {
        void disableOperator();
      }}
      variant="contained"
    >
      {t('operator.profile.disable.disableBtn')}
    </Button>
  );
}

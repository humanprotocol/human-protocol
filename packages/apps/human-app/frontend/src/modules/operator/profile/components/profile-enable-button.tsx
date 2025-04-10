import { t } from 'i18next';
import { useEffect } from 'react';
import { useConnectedWallet } from '@/shared/contexts/wallet-connect';
import { Button } from '@/shared/components/ui/button';
import type { SignatureData } from '@/api/hooks/use-prepare-signature';
import {
  PrepareSignatureType,
  usePrepareSignature,
} from '@/api/hooks/use-prepare-signature';
import { TopNotificationType, useNotification } from '@/shared/hooks';
import { useEnableWeb3Operator } from '../hooks';

export function ProfileEnableButton() {
  const { address, signMessage } = useConnectedWallet();
  const {
    data: signatureData,
    error: signatureDataError,
    isPending: isSignatureDataPending,
  } = usePrepareSignature({
    address,
    type: PrepareSignatureType.ENABLE_OPERATOR,
  });

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

  const enableOperator = async (signaturePayload: SignatureData) => {
    const signature = await signMessage(JSON.stringify(signaturePayload));
    enableOperatorMutation({ signature: signature ?? '' });
  };

  return (
    <Button
      loading={isSignatureDataPending || isEnableOperatorPending}
      onClick={() => {
        if (signatureData) {
          void enableOperator(signatureData);
        }
      }}
      variant="contained"
    >
      {t('operator.profile.activate.activateBtn')}
    </Button>
  );
}

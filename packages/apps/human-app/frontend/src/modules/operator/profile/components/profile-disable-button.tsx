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
import { useDisableWeb3Operator } from '../hooks';

export function ProfileDisableButton() {
  const { address, signMessage } = useConnectedWallet();
  const {
    data: signatureData,
    isPending: isSignatureDataPending,
    error: signatureDataError,
  } = usePrepareSignature({
    address,
    type: PrepareSignatureType.DISABLE_OPERATOR,
  });

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

  const disableOperator = async (signaturePayload: SignatureData) => {
    const signature = await signMessage(JSON.stringify(signaturePayload));
    disableOperatorMutation({ signature: signature ?? '' });
  };

  return (
    <Button
      loading={isSignatureDataPending || isDisableOperatorPending}
      onClick={() => {
        if (signatureData) {
          void disableOperator(signatureData);
        }
      }}
      variant="contained"
    >
      {t('operator.profile.disable.disableBtn')}
    </Button>
  );
}

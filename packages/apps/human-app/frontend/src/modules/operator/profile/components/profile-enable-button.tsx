import { t } from 'i18next';
import { Typography } from '@mui/material';
import { useConnectedWallet } from '@/shared/contexts/wallet-connect';
import { Button } from '@/shared/components/ui/button';
import type { SignatureData } from '@/api/hooks/use-prepare-signature';
import {
  PrepareSignatureType,
  usePrepareSignature,
} from '@/api/hooks/use-prepare-signature';
import { useEnableWeb3Operator } from '../hooks';

export function ProfileEnableButton() {
  const { address, signMessage } = useConnectedWallet();
  const {
    data: signatureData,
    isError: isSignatureDataError,
    isPending: isSignatureDataPending,
  } = usePrepareSignature({
    address,
    type: PrepareSignatureType.ENABLE_OPERATOR,
  });

  const {
    mutate: enableOperatorMutation,
    isError: isEnableOperatorError,
    isPending: isEnableOperatorPending,
  } = useEnableWeb3Operator();

  const enableOperator = async (signaturePayload: SignatureData) => {
    const signature = await signMessage(JSON.stringify(signaturePayload));
    enableOperatorMutation({ signature: signature ?? '' });
  };

  if (isSignatureDataError || isEnableOperatorError) {
    return (
      <Typography>{t('operator.profile.activate.cannotActivate')}</Typography>
    );
  }

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

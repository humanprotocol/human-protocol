import { t } from 'i18next';
import { Typography } from '@mui/material';
import { useDisableWeb3Operator } from '@/api/servieces/operator/disable-operator';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';
import { Button } from '@/components/ui/button';
import type { SignatureData } from '@/api/servieces/common/prepare-signature';
import {
  PrepareSignatureType,
  usePrepareSignature,
} from '@/api/servieces/common/prepare-signature';

export function ProfileDisableButton() {
  const { address, signMessage } = useConnectedWallet();
  const {
    data: signatureData,
    isError: isSignatureDataError,
    isPending: isSignatureDataPending,
  } = usePrepareSignature({
    address,
    type: PrepareSignatureType.DisableOperator,
  });

  const {
    mutate: disableOperatorMutation,
    isError: isDisableOperatorError,
    isPaused: isDisableOperatorPending,
  } = useDisableWeb3Operator();

  const disableOperator = async (signaturePayload: SignatureData) => {
    const signature = await signMessage(JSON.stringify(signaturePayload));
    disableOperatorMutation({ signature: signature || '' });
  };

  if (isSignatureDataError || isDisableOperatorError) {
    return (
      <Typography>{t('operator.profile.disable.cannotDisable')}</Typography>
    );
  }

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

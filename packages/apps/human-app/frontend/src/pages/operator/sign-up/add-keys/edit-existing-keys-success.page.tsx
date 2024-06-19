import { t } from 'i18next';
import { Grid, Typography } from '@mui/material';
import {
  PageCard,
  PageCardError,
  PageCardLoader,
} from '@/components/ui/page-card';
import { Button } from '@/components/ui/button';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { useWeb3SignUp } from '@/api/servieces/operator/web3-signup';
import { Alert } from '@/components/ui/alert';
import type { SignatureData } from '@/api/servieces/common/prepare-signature';
import {
  PrepareSignatureType,
  usePrepareSignature,
} from '@/api/servieces/common/prepare-signature';

export function EditExistingKeysSuccessPage() {
  const { address, signMessage } = useConnectedWallet();
  const {
    data: signatureData,
    isError: isSignatureDataError,
    error: errorSignatureDataError,
    isPending: isSignatureDataPending,
  } = usePrepareSignature({
    address,
    type: PrepareSignatureType.SignUp,
  });

  const {
    mutate: web3SignUpMutation,
    isError: isWeb3SignUpError,
    error: web3SignUpError,
    isPending: web3SignUpPending,
  } = useWeb3SignUp();

  const createSignature = async (data: SignatureData) => {
    const signature = await signMessage(JSON.stringify(data));
    web3SignUpMutation({ signature: signature || '' });
  };

  if (isSignatureDataError) {
    return (
      <PageCardError
        errorMessage={defaultErrorMessage(errorSignatureDataError)}
      />
    );
  }

  if (isSignatureDataPending) {
    return <PageCardLoader />;
  }

  return (
    <PageCard
      alert={
        isWeb3SignUpError ? (
          <Alert color="error" severity="error">
            {defaultErrorMessage(web3SignUpError)}
          </Alert>
        ) : undefined
      }
      hiddenCancelButton
      title={t('operator.editExistingKeysSuccess.title')}
    >
      <Grid container gap="2rem" marginTop="2rem">
        <Grid>
          <Typography variant="subtitle1">
            {t('operator.editExistingKeysSuccess.paragraph1')}
          </Typography>
          <Typography variant="subtitle1">
            {t('operator.editExistingKeysSuccess.paragraph2')}
          </Typography>
        </Grid>
        <Button
          fullWidth
          loading={web3SignUpPending}
          onClick={() => {
            void createSignature(signatureData);
          }}
          variant="contained"
        >
          {t('operator.editExistingKeysSuccess.btn')}
        </Button>
      </Grid>
    </PageCard>
  );
}

import { t } from 'i18next';
import { Grid, Typography } from '@mui/material';
import { PageCardError } from '@/shared/components/ui/page-card-error';
import { PageCardLoader } from '@/shared/components/ui/page-card-loader';
import { PageCard } from '@/shared/components/ui/page-card';
import { Button } from '@/shared/components/ui/button';
import { getErrorMessageForError } from '@/shared/errors';
import { useWeb3SignUp } from '@/modules/operator/hooks/use-web3-signup';
import type { SignatureData } from '@/api/hooks/use-prepare-signature';
import {
  PrepareSignatureType,
  usePrepareSignature,
} from '@/api/hooks/use-prepare-signature';
import { Alert } from '@/shared/components/ui/alert';
import { useConnectedWallet } from '@/modules/auth-web3/hooks/use-connected-wallet';

export function EditExistingKeysSuccessPage() {
  const { address, signMessage } = useConnectedWallet();
  const {
    data: signatureData,
    isError: isSignatureDataError,
    error: errorSignatureDataError,
    isPending: isSignatureDataPending,
  } = usePrepareSignature({
    address,
    type: PrepareSignatureType.SIGN_UP,
  });

  const {
    mutate: web3SignUpMutation,
    isError: isWeb3SignUpError,
    error: web3SignUpError,
    isPending: web3SignUpPending,
  } = useWeb3SignUp();

  const createSignature = async (data: SignatureData) => {
    const signature = await signMessage(JSON.stringify(data));
    web3SignUpMutation({ signature: signature ?? '' });
  };

  if (isSignatureDataError) {
    return (
      <PageCardError
        errorMessage={getErrorMessageForError(errorSignatureDataError)}
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
            {getErrorMessageForError(web3SignUpError)}
          </Alert>
        ) : undefined
      }
      hiddenArrowButton
      hiddenCancelButton
      title={t('operator.editExistingKeysSuccess.title')}
    >
      <Grid container gap="2rem">
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

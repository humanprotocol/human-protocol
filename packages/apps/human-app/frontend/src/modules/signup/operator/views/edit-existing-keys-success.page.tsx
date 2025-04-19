import { t } from 'i18next';
import { Grid, Typography } from '@mui/material';
import {
  PageCardError,
  PageCardLoader,
  PageCard,
} from '@/shared/components/ui/page-card';
import { Button } from '@/shared/components/ui/button';
import { getErrorMessageForError } from '@/shared/errors';
import { Alert } from '@/shared/components/ui/alert';
import { useConnectedWallet } from '@/shared/contexts/wallet-connect';
import { usePrepareSignature } from '@/shared/hooks';
import {
  PrepareSignatureType,
  type SignatureData,
} from '@/shared/services/signature.service';
import { useWeb3SignUp } from '../hooks';

export function EditExistingKeysSuccessPage() {
  const { signMessage } = useConnectedWallet();
  const {
    prepareSignature,
    isError: isSignatureDataError,
    error: errorSignatureDataError,
    isPending: isSignatureDataPending,
  } = usePrepareSignature(PrepareSignatureType.SIGN_UP);

  const {
    mutate: web3SignUpMutation,
    isError: isWeb3SignUpError,
    error: web3SignUpError,
    isPending: web3SignUpPending,
  } = useWeb3SignUp();

  const handleWeb3SignUp = async () => {
    const data: SignatureData = await prepareSignature();
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
      showBackButton={false}
      showCancelButton={false}
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
            void handleWeb3SignUp();
          }}
          variant="contained"
        >
          {t('operator.editExistingKeysSuccess.btn')}
        </Button>
      </Grid>
    </PageCard>
  );
}

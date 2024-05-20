import { t } from 'i18next';
import { Grid, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import {
  PageCard,
  PageCardError,
  PageCardLoader,
} from '@/components/ui/page-card';
import { Button } from '@/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';
import type { SignatureData } from '@/api/servieces/operator/prepare-signature';
import {
  PrepareSignatureType,
  usePrepareSignature,
} from '@/api/servieces/operator/prepare-signature';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';

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

  const createSignature = async (data: SignatureData) => {
    return signMessage(JSON.stringify(data));
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
    <PageCard title={t('operator.editExistingKeysSuccess.title')}>
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
          component={Link}
          fullWidth
          loading={isSignatureDataPending}
          onClick={() => {
            void createSignature(signatureData);
          }}
          to={routerPaths.homePage}
          variant="contained"
        >
          {t('operator.editExistingKeysSuccess.btn')}
        </Button>
      </Grid>
    </PageCard>
  );
}

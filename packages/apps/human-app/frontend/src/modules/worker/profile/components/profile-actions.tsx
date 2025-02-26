import Grid from '@mui/material/Grid';
import { KycVerificationControl } from './kyc-verification-control';
import { WalletConnectionControl } from './wallet-connection-control';

export function ProfileActions() {
  return (
    <Grid container flexDirection="column" gap="1rem">
      <Grid>
        <KycVerificationControl />
      </Grid>

      <Grid>
        <WalletConnectionControl />
      </Grid>
    </Grid>
  );
}

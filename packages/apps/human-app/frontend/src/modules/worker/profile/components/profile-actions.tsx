import Grid from '@mui/material/Grid';
import { IdentityVerificationControl } from './identity-verification-control';
import { WalletConnectionControl } from './wallet-connection-control';

export function ProfileActions() {
  return (
    <Grid container flexDirection="column" gap="1rem">
      <Grid>
        <IdentityVerificationControl />
      </Grid>

      <Grid>
        <WalletConnectionControl />
      </Grid>
    </Grid>
  );
}

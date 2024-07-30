import Grid from '@mui/material/Grid/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography/Typography';
import { t } from 'i18next';
import styled from '@mui/material/styles/styled';
import { CheckmarkIcon } from '@/components/ui/icons';
import { colorPalette } from '@/styles/color-palette';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { useWalletConnect } from '@/hooks/use-wallet-connect';

const CustomTextField = styled(TextField)(() => ({
  '& .Mui-disabled': {
    color: colorPalette.text.disabledSecondary,
    '-webkit-text-fill-color': colorPalette.text.disabledSecondary,
  },
}));

export function WalletConnectDone() {
  const { address } = useWalletConnect();
  const { user } = useAuthenticatedUser();

  return (
    <Grid alignItems="center" container gap="0.5rem" padding="0.5rem 0">
      <Typography variant="buttonLarge">
        {t('worker.profile.walletConnected')}
      </Typography>
      <CheckmarkIcon />
      <CustomTextField
        disabled
        fullWidth
        value={user.wallet_address || address}
      />
    </Grid>
  );
}

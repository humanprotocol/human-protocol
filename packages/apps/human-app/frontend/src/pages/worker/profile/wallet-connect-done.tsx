import Grid from '@mui/material/Grid/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography/Typography';
import { t } from 'i18next';
import styled from '@mui/material/styles/styled';
import { CheckmarkIcon } from '@/components/ui/icons';
import { colorPalette } from '@/styles/color-palette';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { useWalletConnect } from '@/hooks/use-wallet-connect';
import { useColorMode } from '@/hooks/use-color-mode';
import {
  darkColorPalette,
  onlyDarkModeColor,
} from '@/styles/dark-color-palette';

const CustomTextField = styled(TextField)(() => ({
  '& .Mui-disabled': {
    color: colorPalette.text.disabledSecondary,
    '-webkit-text-fill-color': colorPalette.text.disabledSecondary,
  },
}));
const CustomTextFieldDark = styled(TextField)(() => ({
  '& .Mui-disabled': {
    color: darkColorPalette.text.disabledSecondary,
    '-webkit-text-fill-color': darkColorPalette.text.disabledSecondary,
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: `${onlyDarkModeColor.mainColorWithOpacity} !important`,
    },
  },
}));

export function WalletConnectDone() {
  const { isDarkMode } = useColorMode();
  const { address } = useWalletConnect();
  const { user } = useAuthenticatedUser();

  const textFiled = isDarkMode ? (
    <CustomTextFieldDark disabled fullWidth value={user.wallet_address} />
  ) : (
    <CustomTextField disabled fullWidth value={user.wallet_address} />
  );

  return (
    <Grid alignItems="center" container gap="0.5rem" padding="0.5rem 0">
      <Typography variant="buttonLarge">
        {t('worker.profile.walletConnected')}
      </Typography>
      <CheckmarkIcon />
      {address && !user.wallet_address ? null : textFiled}
    </Grid>
  );
}

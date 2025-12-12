import { Stack, TextField, Typography } from '@mui/material';
import { t } from 'i18next';
import styled from '@mui/material/styles/styled';
import { colorPalette } from '@/shared/styles/color-palette';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useColorMode } from '@/shared/contexts/color-mode';
import {
  darkColorPalette,
  onlyDarkModeColor,
} from '@/shared/styles/dark-color-palette';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';
import { Chip } from '@/shared/components/ui/chip';

const CustomTextField = styled(TextField)(() => ({
  '& .Mui-disabled': {
    color: colorPalette.text.disabledSecondary,
    WebkitTextFillColor: colorPalette.text.disabledSecondary,
  },
}));
const CustomTextFieldDark = styled(TextField)(() => ({
  '& .Mui-disabled': {
    color: darkColorPalette.text.disabledSecondary,
    WebkitTextFillColor: darkColorPalette.text.disabledSecondary,
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
    <Stack gap={3}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography variant="buttonLarge">
          {t('worker.profile.wallet')}:{' '}
        </Typography>
        <Chip
          label={t('worker.profile.walletConnected')}
          backgroundColor="success.main"
        />
      </Stack>
      {address && !user.wallet_address ? null : textFiled}
    </Stack>
  );
}

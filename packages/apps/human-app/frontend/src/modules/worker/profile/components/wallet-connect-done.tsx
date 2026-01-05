import { IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { t } from 'i18next';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useWalletConnect } from '@/shared/contexts/wallet-connect';
import { Chip } from '@/shared/components/ui/chip';
import { CopyIcon } from '@/shared/components/ui/icons';
import { MouseEvent, useRef, useState } from 'react';
import { shortenEscrowAddress } from '@/shared/helpers/evm';
import { CustomTextField, CustomTextFieldDark } from './custom-text-field';

export function WalletConnectDone() {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { isDarkMode } = useColorMode();
  const { address } = useWalletConnect();
  const {
    user: { wallet_address },
  } = useAuthenticatedUser();

  if (!wallet_address) {
    return null;
  }

  const shortAddress = shortenEscrowAddress(wallet_address, 6, 6);

  const handleCopyClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (isCopied) return;

    e.stopPropagation();
    navigator.clipboard.writeText(wallet_address);
    setIsCopied(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsCopied(false);
    }, 1500);
  };

  const textFiled = isDarkMode ? (
    <CustomTextFieldDark
      disabled
      fullWidth
      value={shortAddress}
      InputProps={{
        endAdornment: (
          <Tooltip
            title={t('components.copyToClipboard')}
            open={isCopied}
            placement="top"
          >
            <IconButton onClick={handleCopyClick} disabled={isCopied}>
              <CopyIcon />
            </IconButton>
          </Tooltip>
        ),
      }}
    />
  ) : (
    <CustomTextField
      disabled
      fullWidth
      value={shortAddress}
      InputProps={{
        endAdornment: (
          <Tooltip
            title={t('components.copyToClipboard')}
            open={isCopied}
            placement="top"
          >
            <IconButton onClick={handleCopyClick} disabled={isCopied}>
              <CopyIcon />
            </IconButton>
          </Tooltip>
        ),
      }}
    />
  );

  return (
    <Stack gap={1}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography variant="buttonLarge">
          {t('worker.profile.wallet')}
        </Typography>
        <Chip
          label={t('worker.profile.walletConnected')}
          backgroundColor="success.main"
        />
      </Stack>
      {address && !wallet_address ? null : textFiled}
    </Stack>
  );
}

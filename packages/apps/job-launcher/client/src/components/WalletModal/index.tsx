import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Dialog,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import { useConnect } from 'wagmi';
import coinbaseSvg from '../../assets/coinbase.svg';
import metaMaskSvg from '../../assets/metamask.svg';
import walletConnectSvg from '../../assets/walletconnect.svg';

const WALLET_ICONS: Record<string, any> = {
  metaMask: metaMaskSvg,
  coinbaseWalletSDK: coinbaseSvg,
  walletConnect: walletConnectSvg,
};

export default function WalletModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { connect, connectors, error } = useConnect();

  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{ sx: { mx: 2, maxWidth: 'calc(100% - 32px)' } }}
    >
      <Box display="flex" maxWidth="784px">
        <Box
          width={{ xs: '0', md: '50%' }}
          display={{ xs: 'none', md: 'flex' }}
          sx={{
            background: theme.palette.primary.main,
            boxSizing: 'border-box',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
          px={9}
          py={6}
        >
          <Typography variant="h4" fontWeight={600} color="#fff">
            Connect
            <br /> your wallet
          </Typography>
          <Typography color="text.secondary" variant="caption">
            By connecting a wallet, you agree to HUMAN Protocol Terms of Service
            and consent to its Privacy Policy.
          </Typography>
        </Box>
        <Box
          sx={{ boxSizing: 'border-box' }}
          width={{ xs: '100%', md: '50%' }}
          minWidth={{ xs: '340px', sm: '392px' }}
          display="flex"
          flexDirection="column"
          p={{ xs: 2, sm: 4 }}
        >
          <IconButton sx={{ ml: 'auto', mb: 3 }} onClick={onClose}>
            <CloseIcon color="primary" />
          </IconButton>
          <Box width="100%" display="flex" flexDirection="column" gap={3}>
            {connectors.map((connector) => (
              <Button
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  px: 2,
                  py: 3,
                  background: '#f6f7fe',
                  color: theme.palette.text.secondary,
                  border: `1px solid transparent`,
                  '&:hover': {
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.primary.main}`,
                  },
                }}
                key={connector.id}
                onClick={() => {
                  connect({ connector });

                  if (connector.id === 'walletConnect') {
                    onClose();
                  }
                }}
              >
                <img
                  src={connector.icon ?? WALLET_ICONS[connector.id]}
                  alt={connector.id}
                />
                <span>{connector.name}</span>
              </Button>
            ))}
          </Box>

          {error && <div>{error.message}</div>}
        </Box>
      </Box>
    </Dialog>
  );
}

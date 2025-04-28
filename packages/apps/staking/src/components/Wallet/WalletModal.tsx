import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Dialog,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
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

  const { palette } = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{ sx: { m: 0, maxWidth: 'calc(100% - 32px)' } }}
    >
      <Box display="flex" maxWidth="784px">
        <Box
          width={{ xs: '0', md: '50%' }}
          display={{ xs: 'none', md: 'flex' }}
          sx={{
            background: palette.primary.main,
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
          px={9}
          py={6}
        >
          <Typography variant="h4" fontWeight={600} color="#ffffff">
            Connect
            <br /> your wallet
          </Typography>
          <Typography color="text.secondary" variant="caption">
            By connecting a wallet, you agree to HUMAN Protocol Terms of Service
            and consent to its Privacy Policy.
          </Typography>
        </Box>
        <Box
          width={{ xs: '100%', md: '50%' }}
          minWidth={{ xs: '340px', sm: '392px' }}
          display="flex"
          flexDirection="column"
          bgcolor="background.default"
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
                  bgcolor: 'background.grey',
                  color: 'text.secondary',
                  border: `1px solid transparent`,
                  '&:hover': {
                    color: 'text.primary',
                    border: `1px solid ${palette.primary.main}`,
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

import { Box, Button, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { useAccount } from 'wagmi';
import WalletModal from '../WalletModal';

export const EmptyCampaign = () => {
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { isConnected } = useAccount();

  const handleClickCrypto = () => {
    setWalletModalOpen(true);
  };

  useEffect(() => {
    if (isConnected && walletModalOpen) {
      setWalletModalOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '5vh', // Set minimum height to fill the viewport
        background: '#fff', // Set background color to white
        borderRadius: '20px',
      }}
    >
      <Typography variant="h6">
        Please connect your wallet to see your campaigns
        <Button
          variant="contained"
          sx={{ backgroundColor: 'secondary.light', margin: '10px' }}
          size="small"
          onClick={handleClickCrypto}
        >
          Connect Wallet
        </Button>
      </Typography>
      <WalletModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
    </Box>
  );
};

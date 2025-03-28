import { Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import WalletModal from './WalletModal';

export const ConnectWallet = () => {
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { isConnected } = useAccount();

  const handleClickCrypto = () => {
    if (!isConnected) {
      setWalletModalOpen(true);
    }
  };

  useEffect(() => {
    if (isConnected && walletModalOpen) {
      setWalletModalOpen(false);
    }
  }, [isConnected, walletModalOpen]);

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        size="large"
        sx={{ mb: 2, borderRadius: '10px' }}
        onClick={handleClickCrypto}
      >
        Connect
      </Button>
      <WalletModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
    </>
  );
};

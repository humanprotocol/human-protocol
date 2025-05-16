import { useEffect, useState } from 'react';

import { Button } from '@mui/material';
import { useAccount } from 'wagmi';

import WalletModal from './WalletModal';

const ConnectWallet = () => {
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && walletModalOpen) {
      setWalletModalOpen(false);
    }
  }, [isConnected, walletModalOpen]);

  return (
    <>
      <Button
        variant="contained"
        size="medium"
        sx={{ borderRadius: '4px', boxShadow: 'none', height: '42px' }}
        onClick={() => setWalletModalOpen(true)}
      >
        Connect Wallet
      </Button>
      <WalletModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
    </>
  );
};

export default ConnectWallet;

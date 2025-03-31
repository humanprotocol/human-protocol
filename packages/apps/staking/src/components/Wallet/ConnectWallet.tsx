import { Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import WalletModal from './WalletModal';

const ConnectWallet = () => {
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
        size="medium"
        sx={{ borderRadius: '4px', boxShadow: 'none' }}
        onClick={handleClickCrypto}
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

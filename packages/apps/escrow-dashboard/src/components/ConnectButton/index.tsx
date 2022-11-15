import { Button } from '@mui/material';
import React from 'react';
import { useAccount } from 'wagmi';
import WalletModal from '../WalletModal';

export default function ConnectButton() {
  const { address } = useAccount();

  console.log(address);

  if (!address) {
    return (
      <>
        <Button variant="outlined" color="primary">
          Connect Wallet
        </Button>
        <WalletModal />
      </>
    );
  }

  return <>{address}</>;
}

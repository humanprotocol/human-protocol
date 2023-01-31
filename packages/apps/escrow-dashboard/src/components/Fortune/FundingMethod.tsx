import { Box, Button, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import WalletModal from '../WalletModal';
import { RoundedBox } from './RoundedBox';
import { FundingMethodType } from './types';

type FundingMethodProps = {
  onChange: (arg: FundingMethodType) => void;
};

export const FundingMethod = ({ onChange }: FundingMethodProps) => {
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { isConnected } = useAccount();
  const handleClickCrypto = () => {
    if (isConnected) {
      onChange('crypto');
    } else {
      setWalletModalOpen(true);
    }
  };

  useEffect(() => {
    if (isConnected && walletModalOpen) {
      setWalletModalOpen(false);
      onChange('crypto');
    }
  }, [isConnected]);

  return (
    <>
      <RoundedBox sx={{ p: 3, display: 'flex', gap: 3 }}>
        <Box
          sx={{
            width: '100%',
            background: '#fbfbfe',
            borderRadius: '10px',
            textAlign: 'center',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexDirection: 'column',
            py: 8,
          }}
        >
          <img src="/images/fortune-crypto.png" alt="crypto" />
          <Typography variant="body2" color="primary" mt={8}>
            Click to connect your wallet
          </Typography>
          <Button
            variant="outlined"
            sx={{ mt: 2.5, minWidth: '200px' }}
            onClick={handleClickCrypto}
          >
            Crypto
          </Button>
        </Box>
        <Box
          sx={{
            width: '100%',
            background: '#fbfbfe',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexDirection: 'column',
            py: 8,
          }}
        >
          <img src="/images/fortune-fiat.png" alt="fiat" />
          <Typography variant="body2" color="primary" mt={8}>
            Click to fund with credit card
          </Typography>
          <Button
            variant="outlined"
            sx={{ mt: 2.5, minWidth: '200px' }}
            onClick={() => onChange('fiat')}
            disabled
          >
            Fiat (Coming soon)
          </Button>
        </Box>
      </RoundedBox>
      <WalletModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
    </>
  );
};

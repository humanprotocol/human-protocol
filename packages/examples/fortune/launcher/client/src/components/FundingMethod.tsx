import { Box, Button, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { RoundedBox } from './RoundedBox';
import { FundingMethodType } from './types';
import WalletModal from './WalletModal';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <img
            src="/images/fortune-crypto.png"
            alt="crypto"
            style={{ width: 135, height: 'auto' }}
          />
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
          <img
            src="/images/fortune-fiat.png"
            alt="fiat"
            style={{ width: 143, height: 'auto' }}
          />
          <Typography variant="body2" color="primary" mt={8}>
            Click to fund with credit card
          </Typography>
          <Button
            variant="outlined"
            sx={{ mt: 2.5, minWidth: '200px' }}
            onClick={() => onChange('fiat')}
          >
            Fiat
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

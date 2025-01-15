import { Box, Button, Grid, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import fundCryptoImg from '../../assets/fund-crypto.png';
import WalletModal from './WalletModal';

export const FundingMethod = () => {
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
  }, [isConnected]);

  return (
    <>
      <Box
        sx={{
          mx: 'auto',
          maxWidth: '560px',
          minHeight: '480px',
          background: '#fff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          boxShadow:
            '0px 1px 5px rgba(233, 235, 250, 0.20), 0px 2px 2px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
        }}
      >
        <Grid container spacing={4} sx={{ flex: 1 }}>
          <Grid item xs={12}>
            <Box
              sx={{
                width: '100%',
                height: '100%',
                background: '#fff',
                border: '1px solid #dbe1f6',
                borderRadius: '20px',
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                py: 8,
              }}
            >
              <img
                src={fundCryptoImg}
                alt="crypto"
                style={{ width: 135, height: 'auto', marginBottom: '32px' }}
              />
              <Typography variant="h6" color="primary" mb={2}>
                Connect Your Wallet
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                sx={{ mb: 2, borderRadius: '10px' }}
                onClick={handleClickCrypto}
              >
                Connect with Crypto
              </Button>
              <Typography
                variant="body2"
                sx={{ fontSize: '12px', color: '#6b7280' }}
              >
                Secure and instant transactions
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
      <WalletModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
    </>
  );
};

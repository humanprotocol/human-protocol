import { Box, Button, Grid, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import fundCryptoImg from '../../assets/fund-crypto.png';
import WalletModal from './WalletModal';
import SolutionForm from '../SolutionForm';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  return (
    <>
      {isConnected ? (
        <SolutionForm /> // Mostrar el formulario de solución si está conectado
      ) : (
        <Box
          width={{ xs: '100%', md: '50%' }}
          minWidth={{ xs: '340px', sm: '392px' }}
          sx={{
            p: 3,
            background: '#fff',
            borderRadius: '16px',
            boxShadow:
              '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
          }}
        >
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  boxSizing: 'border-box',
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
                  src={fundCryptoImg}
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
            </Grid>
          </Grid>
        </Box>
      )}
      <WalletModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
    </>
  );
};

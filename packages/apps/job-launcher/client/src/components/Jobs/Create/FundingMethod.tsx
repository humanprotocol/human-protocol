import { Box, Button, Grid, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import fundCryptoImg from '../../../assets/fund-crypto.png';
import fundFiatImg from '../../../assets/fund-fiat.png';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import { PayMethod } from '../../../types';
import WalletModal from '../../WalletModal';

export const FundingMethod = () => {
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { isConnected } = useAccount();
  const navigate = useNavigate();
  const { changePayMethod, goToNextStep } = useCreateJobPageUI();

  const handleClickCrypto = () => {
    if (isConnected) {
      changePayMethod?.(PayMethod.Crypto);
      goToNextStep?.();
    } else {
      setWalletModalOpen(true);
    }
  };

  useEffect(() => {
    if (isConnected && walletModalOpen) {
      setWalletModalOpen(false);
      goToNextStep?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  return (
    <>
      <Box
        sx={{
          p: 3,
          background: '#fff',
          borderRadius: '16px',
          boxShadow:
            '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
        }}
      >
        <Grid container spacing={4}>
          <Grid
            item
            xs={12}
            md={import.meta.env.VITE_APP_NETWORK === 'mainnet' ? 12 : 6}
          >
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
          {import.meta.env.VITE_APP_NETWORK !== 'mainnet' && (
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  boxSizing: 'border-box',
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
                  src={fundFiatImg}
                  alt="fiat"
                  style={{ width: 143, height: 'auto' }}
                />
                <Typography variant="body2" color="primary" mt={8}>
                  Click to pay with credit card
                </Typography>
                <Box
                  sx={{
                    mt: 2.5,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '18px',
                    flexWrap: 'wrap',
                  }}
                >
                  <Button
                    variant="outlined"
                    sx={{ minWidth: '200px' }}
                    onClick={() => {
                      changePayMethod?.(PayMethod.Fiat);
                      goToNextStep?.();
                    }}
                  >
                    Pay with Credit Card
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ minWidth: '200px' }}
                    onClick={() => navigate('/profile/top-up')}
                  >
                    Top up your account
                  </Button>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
      <WalletModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
    </>
  );
};

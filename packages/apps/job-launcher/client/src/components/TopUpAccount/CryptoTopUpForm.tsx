import HMTokenABI from '@human-protocol/core/abis/HMToken.json';
import {
  Alert,
  Box,
  Button,
  FormControl,
  Grid,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ethers } from 'ethers';
import React, { useMemo, useState } from 'react';
import { useAccount, useChainId, useSigner } from 'wagmi';
import { TokenSelect } from '../../components/TokenSelect';
import { JOB_LAUNCHER_OPERATOR_ADDRESS } from '../../constants/addresses';
import { TOP_UP_FEE } from '../../constants/payment';
import { useTokenRate } from '../../hooks/useTokenRate';
import * as paymentService from '../../services/payment';
import { TopUpSuccess } from './TopUpSuccess';

export const CryptoTopUpForm = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [tokenAddress, setTokenAddress] = useState<string>();
  const [amount, setAmount] = useState<string>();
  const [isSuccess, setIsSuccess] = useState(false);
  const { data: signer } = useSigner();
  const rate = useTokenRate('hmt', 'usd');

  const totalAmount = useMemo(() => {
    if (!amount) return 0;
    return parseFloat(amount) * rate;
  }, [amount, rate]);

  const feeAmount = useMemo(() => {
    return (totalAmount * TOP_UP_FEE) / 100;
  }, [totalAmount]);

  const handleTopUpAccount = async () => {
    if (!signer || !tokenAddress || !amount) return;

    try {
      // send HMT token to operator and retrieve transaction hash
      const contract = new ethers.Contract(tokenAddress, HMTokenABI, signer);
      const tokenAmount = ethers.utils.parseUnits(amount, 18);

      const tx = await contract.transfer(
        JOB_LAUNCHER_OPERATOR_ADDRESS,
        tokenAmount
      );

      await tx.wait();

      const transactionHash = tx.hash;

      // create crypto payment record
      await paymentService.createCryptoPayment({
        chainId,
        transactionHash,
      });
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
    }
  };

  return isSuccess ? (
    <TopUpSuccess />
  ) : (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={4} mb={6} sx={{ width: '100%' }}>
        <Grid item xs={12} sm={12} md={6}>
          <Box
            sx={{
              height: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '30px',
            }}
          >
            {isConnected ? (
              <Alert variant="outlined" severity="success">
                Your wallet is connected
              </Alert>
            ) : (
              <Alert variant="outlined" severity="error">
                Please connect your wallet
              </Alert>
            )}
            <TokenSelect
              chainId={chainId}
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value as string)}
            />
            <FormControl fullWidth>
              <TextField
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </FormControl>
          </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Box
            sx={{ borderRadius: '8px', background: '#F9FAFF', px: 4, py: 1.5 }}
          >
            <Box sx={{ py: 2 }}>
              <Typography mb={1}>Transaction details</Typography>
              <Stack
                direction="column"
                spacing={1}
                sx={{
                  borderBottom: '1px solid #E5E7EB',
                  pb: 2,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">HMT Price</Typography>
                  <Typography color="text.secondary">
                    {rate.toFixed(2)} USD
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">Fees</Typography>
                  <Typography color="text.secondary">
                    ({TOP_UP_FEE}%) {feeAmount.toFixed(2)} USD
                  </Typography>
                </Stack>
              </Stack>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ py: 2 }}
              >
                <Typography>You receive</Typography>
                <Typography>
                  {(totalAmount - feeAmount).toFixed(2)} USD
                </Typography>
              </Stack>
            </Box>
          </Box>
        </Grid>
      </Grid>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: 4,
        }}
      >
        <Button
          color="primary"
          variant="contained"
          sx={{ width: '400px' }}
          size="large"
          onClick={handleTopUpAccount}
        >
          Top up account
        </Button>
        <Link
          href="https://humanprotocol.org/app/terms-and-conditions"
          target="_blank"
        >
          <Typography variant="caption" mt={4} component="p">
            Terms & conditions
          </Typography>
        </Link>
      </Box>
    </Box>
  );
};

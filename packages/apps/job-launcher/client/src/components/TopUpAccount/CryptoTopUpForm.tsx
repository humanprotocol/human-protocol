import HMTokenABI from '@human-protocol/core/abis/HMToken.json';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  FormControl,
  Grid,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ethers } from 'ethers';
import React, { useMemo, useState } from 'react';
import { Address } from 'viem';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { TokenSelect } from '../../components/TokenSelect';
import { SUPPORTED_CHAIN_IDS } from '../../constants/chains';
import { useTokenRate } from '../../hooks/useTokenRate';
import { useSnackbar } from '../../providers/SnackProvider';
import * as paymentService from '../../services/payment';
import { useAppDispatch } from '../../state';
import { fetchUserBalanceAsync } from '../../state/auth/reducer';
import { TopUpSuccess } from './TopUpSuccess';

export const CryptoTopUpForm = () => {
  const { isConnected, chain } = useAccount();
  const dispatch = useAppDispatch();
  const [tokenAddress, setTokenAddress] = useState<string>();
  const [amount, setAmount] = useState<string>();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const publicClient = usePublicClient();
  const { data: signer } = useWalletClient();
  const { data: rate } = useTokenRate('hmt', 'usd');
  const { showError } = useSnackbar();

  const totalAmount = useMemo(() => {
    if (!amount) return 0;
    return parseFloat(amount) * rate;
  }, [amount, rate]);

  const handleTopUpAccount = async () => {
    if (!signer || !chain || !tokenAddress || !amount) return;

    setIsLoading(true);

    try {
      const transactionHash = await signer.writeContract({
        address: tokenAddress as Address,
        abi: HMTokenABI,
        functionName: 'transfer',
        args: [
          await paymentService.getOperatorAddress(),
          ethers.parseUnits(amount, 18),
        ],
      });

      await publicClient?.waitForTransactionReceipt({
        hash: transactionHash,
        confirmations: Number(import.meta.env.VITE_APP_MIN_CONFIRMATIONS) ?? 1,
      });

      // create crypto payment record
      await paymentService.createCryptoPayment(signer, {
        chainId: chain?.id,
        transactionHash,
      });

      dispatch(fetchUserBalanceAsync());

      setIsSuccess(true);
    } catch (err: any) {
      showError(err);
      setIsSuccess(false);
    }

    setIsLoading(false);
  };

  if (!chain || !SUPPORTED_CHAIN_IDS.includes(chain.id))
    return (
      <Box>
        <Typography>
          You are on wrong network, please switch to one of the supported
          networks.
        </Typography>
      </Box>
    );

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
              chainId={chain?.id}
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value as string)}
            />
            <FormControl fullWidth>
              <TextField
                placeholder="Amount"
                type="number"
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
                    {rate?.toFixed(2)} USD
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
                <Typography>{totalAmount.toFixed(2)} USD</Typography>
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
        <LoadingButton
          color="primary"
          variant="contained"
          sx={{ width: '400px' }}
          size="large"
          onClick={handleTopUpAccount}
          loading={isLoading}
          disabled={!isConnected || !tokenAddress || !amount}
        >
          Top up account
        </LoadingButton>
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

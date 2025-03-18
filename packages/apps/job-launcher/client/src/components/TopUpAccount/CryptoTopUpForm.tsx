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
import { Decimal } from 'decimal.js';
import { ethers } from 'ethers';
import React, { useMemo, useState } from 'react';
import { Address } from 'viem';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { TokenSelect } from '../../components/TokenSelect';
import { SUPPORTED_CHAIN_IDS } from '../../constants/chains';
import { useTokenRate } from '../../hooks/useTokenRate';
import { useSnackbar } from '../../providers/SnackProvider';
import * as paymentService from '../../services/payment';
import { useAppDispatch, useAppSelector } from '../../state';
import { fetchUserBalanceAsync } from '../../state/auth/reducer';
import { TopUpSuccess } from './TopUpSuccess';

export const CryptoTopUpForm = () => {
  const { isConnected, chain } = useAccount();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [tokenAddress, setTokenAddress] = useState<string>();
  const [tokenSymbol, setTokenSymbol] = useState<string>();
  const [amount, setAmount] = useState<string>();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const publicClient = usePublicClient();
  const { data: signer } = useWalletClient();
  const { data: rate } = useTokenRate(tokenSymbol || 'hmt', 'usd');
  const { showError } = useSnackbar();
  const [tokenDecimals, setTokenDecimals] = useState<number>(18);

  const currentBalance = useMemo(() => {
    return (
      user?.balance?.balances.find(
        (balance) => balance.currency === tokenSymbol,
      )?.amount ?? 0
    );
  }, [user, tokenSymbol]);

  const totalAmount = useMemo(() => {
    if (!amount || !rate) return new Decimal(0);
    return new Decimal(amount).mul(rate);
  }, [amount, rate]);

  const handleTokenChange = (
    symbol: string,
    address: string,
    decimals: number,
  ) => {
    setTokenSymbol(symbol);
    setTokenAddress(address);
    setTokenDecimals(decimals);

    if (amount) {
      const maxDecimals = Math.min(decimals, 6);
      const [integerPart, decimalPart] = amount.split('.');
      if (decimalPart && decimalPart.length > maxDecimals) {
        setAmount(`${integerPart}.${decimalPart.slice(0, maxDecimals)}`);
      }
    }
  };

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
          ethers.parseUnits(amount.toString(), tokenDecimals),
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
          Your wallet is connected to an unsupported network. Please switch to a
          supported network.
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
              value={tokenSymbol}
              label={'Payment token'}
              onTokenChange={handleTokenChange}
            />
            <FormControl fullWidth>
              <TextField
                placeholder="Amount"
                type="number"
                value={amount}
                onChange={(e) => {
                  let value = e.target.value;
                  const maxDecimals = Math.min(tokenDecimals, 6);
                  const regex = new RegExp(`^\\d*\\.?\\d{0,${maxDecimals}}$`);
                  if (regex.test(value)) {
                    setAmount(value);
                  }
                }}
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
                  <Typography color="text.secondary">Balance</Typography>
                  <Typography color="text.secondary">
                    {tokenSymbol
                      ? `${Number(currentBalance.toFixed(6))} ${tokenSymbol?.toUpperCase()} (~
                    ${Number(((currentBalance ?? 0) * rate).toFixed(2))}
                    USD)`
                      : ''}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">
                    {tokenSymbol?.toUpperCase()} Price
                  </Typography>
                  <Typography color="text.secondary">
                    {rate ? `${rate.toFixed(2)} USD` : ''}
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
                  {amount && tokenSymbol
                    ? `${amount} ${tokenSymbol?.toUpperCase()} (~
                  ${totalAmount.toFixed(2)} USD)`
                    : ''}
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

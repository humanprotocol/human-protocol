import HMTokenABI from '@human-protocol/core/abis/HMToken.json';
import { NETWORKS } from '@human-protocol/sdk';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ethers } from 'ethers';
import React, { useMemo, useState } from 'react';
import { useAccount, useNetwork, useSigner } from 'wagmi';
import { TokenSelect } from '../../../components/TokenSelect';
import { JOB_LAUNCHER_FEE } from '../../../constants/payment';
import { useTokenRate } from '../../../hooks/useTokenRate';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import * as jobService from '../../../services/job';
import * as paymentService from '../../../services/payment';
import { useAppSelector } from '../../../state';
import { JobType } from '../../../types';

export const CryptoPayForm = ({
  onStart,
  onFinish,
  onError,
}: {
  onStart: () => void;
  onFinish: () => void;
  onError: (err: any) => void;
}) => {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const { jobRequest, goToPrevStep } = useCreateJobPageUI();
  const [tokenAddress, setTokenAddress] = useState<string>();
  const [payWithAccountBalance, setPayWithAccountBalance] = useState(false);
  const [amount, setAmount] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const { data: signer } = useSigner();
  const { user } = useAppSelector((state) => state.auth);
  const { data: rate } = useTokenRate('hmt', 'usd');

  const fundAmount = useMemo(() => {
    if (amount && rate) return Number(amount) * rate;
    return 0;
  }, [amount, rate]);
  const feeAmount = fundAmount === 0 ? 0 : Math.max(0.01, fundAmount * (JOB_LAUNCHER_FEE / 100));
  const totalAmount = fundAmount + feeAmount;
  const accountAmount = user?.balance ? Number(user?.balance?.amount) : 0;

  const balancePayAmount = useMemo(() => {
    if (!payWithAccountBalance) return 0;
    if (totalAmount < accountAmount) return totalAmount;
    return accountAmount;
  }, [payWithAccountBalance, totalAmount, accountAmount]);

  const walletPayAmount = useMemo(() => {
    if (!payWithAccountBalance) return totalAmount;
    if (totalAmount < accountAmount) return 0;
    return totalAmount - accountAmount;
  }, [payWithAccountBalance, totalAmount, accountAmount]);

  const handlePay = async () => {
    if (signer && tokenAddress && amount && jobRequest.chainId) {
      setIsLoading(true);
      try {
        if (walletPayAmount > 0) {
          // send HMT token to operator and retrieve transaction hash
          const tokenAmount = walletPayAmount / rate;

          const contract = new ethers.Contract(tokenAddress, HMTokenABI, signer);

          const tx = await contract.transfer(
            import.meta.env.VITE_APP_JOB_LAUNCHER_ADDRESS,
            ethers.utils.parseUnits(tokenAmount.toFixed(2), 18)
          );

          await tx.wait();

          // create crypto payment record
          await paymentService.createCryptoPayment(signer, {
            chainId: jobRequest.chainId,
            transactionHash: tx.hash,
          });
        }

        // create job
        const { jobType, chainId, fortuneRequest, cvatRequest, hCaptchaRequest } = jobRequest;
        if (jobType === JobType.Fortune && fortuneRequest) {
          await jobService.createFortuneJob(chainId, fortuneRequest, fundAmount);
        } else if (jobType === JobType.CVAT && cvatRequest) {
          await jobService.createCvatJob(chainId, cvatRequest, fundAmount);
        } else if (jobType === JobType.HCAPTCHA && hCaptchaRequest) {
          await jobService.createHCaptchaJob(chainId, hCaptchaRequest, fundAmount);
        }
        onFinish();
      } catch (err) {
        onError(err);
      }
      setIsLoading(false);
    }
  };

  if (!chain || chain.unsupported || chain.id !== jobRequest.chainId)
    return (
      <Box textAlign="center">
        <Typography textAlign="center">
          You are on wrong network, please switch to {NETWORKS[jobRequest.chainId!]?.title}.
        </Typography>
        <Button variant="outlined" onClick={() => goToPrevStep?.()}>
          Back
        </Button>
      </Box>
    );

  return (
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
            <Box
              sx={{
                borderRadius: '8px',
                background: '#F9FAFF',
                padding: '8px 31px 8px 22px',
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    defaultChecked
                    checked={payWithAccountBalance}
                    onChange={(e) => setPayWithAccountBalance(e.target.checked)}
                  />
                }
                label="I want to pay with my account balance"
              />
            </Box>
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
                value={amount}
                type="number"
                onChange={(e) => setAmount(e.target.value as string)}
                placeholder="Amount"
              />
            </FormControl>
          </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Box sx={{ borderRadius: '8px', background: '#F9FAFF', px: 4, py: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 2,
                borderBottom: '1px solid #E5E7EB',
              }}
            >
              <Typography>Account Balance</Typography>
              <Typography color="text.secondary">
                {user?.balance?.amount?.toFixed(2) ?? '0'} {user?.balance?.currency?.toUpperCase() ?? 'USD'}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 2,
                borderBottom: '1px solid #E5E7EB',
              }}
            >
              <Typography>Fund Amount</Typography>
              <Typography color="text.secondary">{fundAmount?.toFixed(2)} USD</Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 2,
                borderBottom: '1px solid #E5E7EB',
              }}
            >
              <Typography>Fees</Typography>
              <Typography color="text.secondary">
                ({JOB_LAUNCHER_FEE}%) {feeAmount?.toFixed(2)} USD
              </Typography>
            </Box>
            <Box sx={{ py: 1.5 }}>
              <Typography mb={2}>Payment method</Typography>
              <Stack direction="column" spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary">Balance</Typography>
                  <Typography color="text.secondary">{balancePayAmount.toFixed(2)} USD</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary">Crypto Wallet</Typography>
                  <Typography color="text.secondary">{walletPayAmount.toFixed(2)} USD</Typography>
                </Stack>
                {/* <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">Fees</Typography>
                  <Typography color="text.secondary">(3.1%) 9.3 USD</Typography>
                </Stack> */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography>Total</Typography>
                  <Typography>{totalAmount?.toFixed(2)} USD</Typography>
                </Stack>
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
        <Box>
          <LoadingButton
            color="primary"
            variant="contained"
            sx={{ width: '240px' }}
            size="large"
            onClick={handlePay}
            disabled={!isConnected || !tokenAddress || !amount || jobRequest.chainId !== chain?.id}
            loading={isLoading}
          >
            Pay now
          </LoadingButton>
          <Button
            color="primary"
            variant="outlined"
            sx={{ width: '240px', ml: 4 }}
            size="large"
            onClick={() => goToPrevStep?.()}
          >
            Cancel
          </Button>
        </Box>
        <Link href="https://humanprotocol.org/app/terms-and-conditions" target="_blank">
          <Typography variant="caption" mt={4} component="p">
            Terms & conditions
          </Typography>
        </Link>
      </Box>
    </Box>
  );
};

import HMTokenABI from '@human-protocol/core/abis/HMToken.json';
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
import React, { useState } from 'react';
import { useAccount, useSigner } from 'wagmi';
import { TokenSelect } from '../../../components/TokenSelect';
import { JOB_LAUNCHER_OPERATOR_ADDRESS } from '../../../constants/addresses';
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
  const { jobRequest, goToPrevStep } = useCreateJobPageUI();
  const [tokenAddress, setTokenAddress] = useState<string>();
  const [amount, setAmount] = useState<string>();
  const { data: signer } = useSigner();
  const { user } = useAppSelector((state) => state.auth);

  const handlePay = async () => {
    if (signer && tokenAddress && amount) {
      onStart();
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
          chainId: jobRequest.chainId,
          transactionHash,
        });

        // create job
        const { jobType, chainId, fortuneRequest, annotationRequest } =
          jobRequest;
        if (jobType === JobType.Fortune && fortuneRequest) {
          await jobService.createFortuneJob(chainId, fortuneRequest, amount);
        } else if (jobType === JobType.Annotation && annotationRequest) {
          await jobService.createAnnotationJob(
            chainId,
            annotationRequest,
            amount
          );
        }
        onFinish();
      } catch (err) {
        onError(err);
      }
    }
  };

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
                control={<Checkbox defaultChecked />}
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
              chainId={jobRequest.chainId}
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value as string)}
            />
            <FormControl fullWidth>
              <TextField
                value={amount}
                onChange={(e) => setAmount(e.target.value as string)}
                placeholder="Amount"
              />
            </FormControl>
          </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Box
            sx={{ borderRadius: '8px', background: '#F9FAFF', px: 4, py: 1.5 }}
          >
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
                {user?.balance?.amount ?? '0'}{' '}
                {user?.balance?.currency?.toUpperCase() ?? 'USD'}
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
              <Typography>Amount due</Typography>
              <Typography color="text.secondary">300 USD</Typography>
            </Box>
            <Box sx={{ py: 1.5 }}>
              <Typography mb={2}>Payment method</Typography>
              <Stack direction="column" spacing={1}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">Balance</Typography>
                  <Typography color="text.secondary">100 USD</Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">Crypto Wallet</Typography>
                  <Typography color="text.secondary">200 USD</Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">Fees</Typography>
                  <Typography color="text.secondary">(3.1%) 9.3 USD</Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography>Total</Typography>
                  <Typography>309.3 USD</Typography>
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
          <Button
            color="primary"
            variant="contained"
            sx={{ width: '240px' }}
            size="large"
            onClick={handlePay}
            disabled={!isConnected || !tokenAddress || !amount}
          >
            Pay now
          </Button>
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

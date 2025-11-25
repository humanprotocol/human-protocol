import HMTokenABI from '@human-protocol/core/abis/HMToken.json';
import KVStoreABI from '@human-protocol/core/abis/KVStore.json';
import { KVStoreKeys, NETWORKS } from '@human-protocol/sdk';
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
import { Decimal } from 'decimal.js';
import { ethers } from 'ethers';
import { useEffect, useMemo, useState } from 'react';
import { Address } from 'viem';
import {
  useAccount,
  useReadContract,
  useWalletClient,
  usePublicClient,
} from 'wagmi';
import { TokenSelect } from '../../../components/TokenSelect';
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
  const { chain } = useAccount();
  const { jobRequest, goToPrevStep } = useCreateJobPageUI();
  const [paymentTokenAddress, setPaymentTokenAddress] = useState<string>();
  const [paymentTokenSymbol, setPaymentTokenSymbol] = useState<string>();
  const [fundTokenSymbol, setFundTokenSymbol] = useState<string>();
  const [payWithAccountBalance, setPayWithAccountBalance] = useState(false);
  const [amount, setAmount] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [jobLauncherAddress, setJobLauncherAddress] = useState<string>();
  const [minFee, setMinFee] = useState<number>(0.01);
  const { data: signer } = useWalletClient();
  const publicClient = usePublicClient();
  const { user } = useAppSelector((state) => state.auth);
  const [paymentTokenRate, setPaymentTokenRate] = useState<number>(0);
  const [fundTokenRate, setFundTokenRate] = useState<number>(0);
  const [decimals, setDecimals] = useState<number>(6);
  const [tokenDecimals, setTokenDecimals] = useState<number>(18);

  useEffect(() => {
    const fetchJobLauncherData = async () => {
      const address = await paymentService.getOperatorAddress();
      const fee = await paymentService.getFee();
      setJobLauncherAddress(address);
      setMinFee(fee);
    };

    fetchJobLauncherData();
  }, []);

  useEffect(() => {
    const fetchRates = async () => {
      if (paymentTokenSymbol && fundTokenSymbol) {
        if (paymentTokenSymbol === fundTokenSymbol) {
          const rate = await paymentService.getRate(paymentTokenSymbol, 'usd');
          setPaymentTokenRate(rate);
          setFundTokenRate(rate);
        } else {
          const paymentRate = await paymentService.getRate(
            paymentTokenSymbol,
            'usd',
          );
          const fundRate = await paymentService.getRate(fundTokenSymbol, 'usd');
          setPaymentTokenRate(paymentRate);
          setFundTokenRate(fundRate);
        }
      }
    };

    fetchRates();
  }, [paymentTokenSymbol, fundTokenSymbol]);

  useEffect(() => {
    if (amount) {
      const [integerPart, decimalPart] = amount.split('.');
      if (decimalPart && decimalPart.length > decimals) {
        setAmount(`${integerPart}.${decimalPart.slice(0, decimals)}`);
      }
    }
  }, [decimals, amount]);

  useEffect(() => {
    setDecimals(Math.min(tokenDecimals, 6));
  }, [tokenDecimals]);

  const { data: jobLauncherFee } = useReadContract({
    address: NETWORKS[jobRequest.chainId!]?.kvstoreAddress as Address,
    abi: KVStoreABI,
    functionName: 'get',
    args: jobLauncherAddress
      ? [jobLauncherAddress, KVStoreKeys.fee]
      : undefined,
    query: {
      enabled: !!jobLauncherAddress,
    },
  });

  const minFeeToken = useMemo(() => {
    if (minFee && paymentTokenRate)
      return new Decimal(minFee).div(paymentTokenRate).toNumber();
    return 0;
  }, [minFee, paymentTokenRate]);

  const feeAmount = useMemo(() => {
    if (!amount) return 0;
    const amountDecimal = new Decimal(amount);
    const feeDecimal = new Decimal(jobLauncherFee as string).div(100);
    return Number(
      Decimal.max(minFeeToken, amountDecimal.mul(feeDecimal)).toFixed(decimals),
    );
  }, [amount, jobLauncherFee, minFeeToken, decimals]);

  const totalAmount = useMemo(() => {
    if (!amount) return 0;
    return Number(
      new Decimal(amount).plus(feeAmount).toNumber().toFixed(decimals),
    );
  }, [amount, decimals, feeAmount]);

  const totalUSDAmount = useMemo(() => {
    if (!totalAmount || !paymentTokenRate) return 0;
    return new Decimal(totalAmount).mul(paymentTokenRate).toNumber();
  }, [totalAmount, paymentTokenRate]);

  const conversionRate = useMemo(() => {
    if (paymentTokenRate && fundTokenRate) {
      return new Decimal(paymentTokenRate).div(fundTokenRate).toNumber();
    }
    return 1;
  }, [paymentTokenRate, fundTokenRate]);

  const fundAmount = useMemo(() => {
    if (!amount || !conversionRate) return 0;
    return Number(new Decimal(amount).mul(conversionRate));
  }, [amount, conversionRate]);

  const currentBalance = useMemo(() => {
    return (
      user?.balance?.balances.find(
        (balance) => balance.currency === paymentTokenSymbol,
      )?.amount ?? 0
    );
  }, [user, paymentTokenSymbol]);

  const balancePayAmount = useMemo(() => {
    if (!payWithAccountBalance) return 0;
    const totalAmountDecimal = new Decimal(totalAmount);
    if (totalAmountDecimal.lessThan(currentBalance)) return totalAmountDecimal;
    return currentBalance;
  }, [payWithAccountBalance, totalAmount, currentBalance]);

  const walletPayAmount = useMemo(() => {
    if (!payWithAccountBalance) return totalAmount;
    const totalAmountDecimal = new Decimal(totalAmount);
    if (totalAmountDecimal.lessThan(currentBalance)) return 0;
    return Number(totalAmountDecimal.minus(currentBalance));
  }, [payWithAccountBalance, totalAmount, currentBalance]);

  const handlePay = async () => {
    if (
      signer &&
      paymentTokenAddress &&
      amount &&
      jobRequest.chainId &&
      paymentTokenSymbol &&
      fundTokenSymbol
    ) {
      setIsLoading(true);
      try {
        if (walletPayAmount > 0) {
          const hash = await signer.writeContract({
            address: paymentTokenAddress as Address,
            abi: HMTokenABI,
            functionName: 'transfer',
            args: [
              jobLauncherAddress,
              ethers.parseUnits(walletPayAmount.toString(), tokenDecimals),
            ],
          });

          await publicClient?.waitForTransactionReceipt({
            hash,
            confirmations: Number(
              import.meta.env.VITE_APP_MIN_CONFIRMATIONS ?? 1,
            ),
            retryCount: 10,
            retryDelay: ({ count }) => Math.min(1000 * 2 ** count, 30000),
          });

          // create crypto payment record
          await paymentService.createCryptoPayment(signer, {
            chainId: jobRequest.chainId,
            transactionHash: hash,
          });
        }

        // create job
        const {
          jobType,
          chainId,
          fortuneRequest,
          cvatRequest,
          hCaptchaRequest,
          audinoRequest,
        } = jobRequest;
        if (jobType === JobType.FORTUNE && fortuneRequest) {
          await jobService.createFortuneJob(
            chainId,
            fortuneRequest,
            paymentTokenSymbol,
            Number(amount),
            fundTokenSymbol,
          );
        } else if (jobType === JobType.CVAT && cvatRequest) {
          await jobService.createCvatJob(
            chainId,
            cvatRequest,
            paymentTokenSymbol,
            Number(amount),
            fundTokenSymbol,
          );
        } else if (jobType === JobType.HCAPTCHA && hCaptchaRequest) {
          await jobService.createHCaptchaJob(chainId, hCaptchaRequest);
        } else if (jobType === JobType.AUDINO && audinoRequest) {
          await jobService.createAudinoJob(
            chainId,
            audinoRequest,
            paymentTokenSymbol,
            Number(amount),
            fundTokenSymbol,
          );
        }
        onFinish();
      } catch (err) {
        onError(err);
      }
      setIsLoading(false);
    }
  };

  if (!chain || chain.id !== jobRequest.chainId)
    return (
      <Box textAlign="center">
        <Typography textAlign="center">
          You are on wrong network, please switch to{' '}
          {NETWORKS[jobRequest.chainId!]?.title}.
        </Typography>
        <Button variant="outlined" onClick={goToPrevStep}>
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
              value={paymentTokenSymbol}
              label={'Payment token'}
              labelId={'payment-token'}
              onTokenChange={(symbol, address, decimals) => {
                setPaymentTokenSymbol(symbol);
                setPaymentTokenAddress(address);
                setTokenDecimals(decimals);
                if (amount) {
                  const maxDecimals = Math.min(decimals, 6);
                  const [integerPart, decimalPart] = amount.split('.');
                  if (decimalPart && decimalPart.length > maxDecimals) {
                    setAmount(
                      `${integerPart}.${decimalPart.slice(0, maxDecimals)}`,
                    );
                  }
                }
              }}
            />
            <FormControl fullWidth>
              <TextField
                value={amount}
                type="number"
                onChange={(e) => {
                  const value = e.target.value;
                  const regex = new RegExp(`^\\d*\\.?\\d{0,${decimals}}$`);
                  if (regex.test(value)) {
                    setAmount(value);
                  }
                }}
                placeholder="Amount"
              />
            </FormControl>
            <TokenSelect
              chainId={chain?.id}
              value={fundTokenSymbol}
              label={'Fund token'}
              labelId={'fund-token'}
              onTokenChange={(symbol) => {
                setFundTokenSymbol(symbol);
              }}
            />
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
              <Typography>Balance</Typography>
              <Typography color="text.secondary">
                {paymentTokenSymbol
                  ? `${Number(currentBalance?.toFixed(6))} ${paymentTokenSymbol?.toUpperCase()}`
                  : ''}
              </Typography>
            </Box>
            <Box
              sx={{
                py: 2,
                borderBottom: '1px solid #E5E7EB',
              }}
            >
              <Stack direction="column" spacing={1}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography>Amount</Typography>
                  <Typography color="text.secondary">
                    {paymentTokenSymbol
                      ? `${amount} ${paymentTokenSymbol?.toUpperCase()}`
                      : ''}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography>Fee</Typography>
                  <Typography color="text.secondary">
                    ({Number(jobLauncherFee)}%){' '}
                    {paymentTokenSymbol
                      ? `${Number(feeAmount.toFixed(6))} ${paymentTokenSymbol?.toUpperCase()}`
                      : ''}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography>Total payment</Typography>
                  <Typography>
                    {paymentTokenSymbol
                      ? `${Number(totalAmount?.toFixed(6))} ${paymentTokenSymbol?.toUpperCase()} (~${totalUSDAmount.toFixed(2)} USD)`
                      : ''}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
            <Box sx={{ py: 1.5, borderBottom: '1px solid #E5E7EB' }}>
              <Typography mb={2}>Payment method</Typography>
              <Stack direction="column" spacing={1}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">Balance</Typography>
                  <Typography color="text.secondary">
                    {paymentTokenSymbol
                      ? `${Number(balancePayAmount?.toFixed(6))} ${paymentTokenSymbol?.toUpperCase()}`
                      : ''}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">Crypto Wallet</Typography>
                  <Typography color="text.secondary">
                    {paymentTokenSymbol
                      ? `${Number(walletPayAmount?.toFixed(6))} ${paymentTokenSymbol?.toUpperCase()}`
                      : ''}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 2,
              }}
            >
              <Typography>Fund Amount</Typography>
              <Typography color="text.secondary">
                {fundTokenSymbol && fundAmount
                  ? `${Number(fundAmount?.toFixed(6))} ${fundTokenSymbol?.toUpperCase()}`
                  : ''}
              </Typography>
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
            disabled={
              !isConnected ||
              !paymentTokenAddress ||
              !fundTokenSymbol ||
              !amount ||
              jobRequest.chainId !== chain?.id
            }
            loading={isLoading}
          >
            Pay now
          </LoadingButton>
          <Button
            color="primary"
            variant="outlined"
            sx={{ width: '240px', ml: 4 }}
            size="large"
            onClick={goToPrevStep}
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

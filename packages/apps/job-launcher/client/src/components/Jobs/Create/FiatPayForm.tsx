import KVStoreABI from '@human-protocol/core/abis/KVStore.json';
import { KVStoreKeys, NETWORKS } from '@human-protocol/sdk';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  BoxProps,
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
import { styled } from '@mui/material/styles';
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { useEffect, useMemo, useState } from 'react';
import { Address } from 'viem';
import { useReadContract } from 'wagmi';
import { CURRENCY } from '../../../constants/payment';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import * as jobService from '../../../services/job';
import * as paymentService from '../../../services/payment';
import { useAppDispatch, useAppSelector } from '../../../state';
import { fetchUserBalanceAsync } from '../../../state/auth/reducer';
import { JobType } from '../../../types';

const StripeElement = styled(Box)<BoxProps & { disabled?: boolean }>(
  (props) => ({
    border: '1px solid rgba(50,10,141,0.5)',
    borderRadius: '4px',
    height: '56px',
    padding: '18px 16px',
    pointerEvents: props.disabled ? 'none' : 'auto',
    opacity: props.disabled ? 0.2 : 1,
    '&:focus-within': {
      borderColor: '#32108D',
    },
  }),
);

export const FiatPayForm = ({
  onStart,
  onFinish,
  onError,
}: {
  onStart: () => void;
  onFinish: () => void;
  onError: (err: any) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { jobRequest, goToPrevStep } = useCreateJobPageUI();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const [payWithAccountBalance, setPayWithAccountBalance] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    name: '',
  });
  const [jobLauncherAddress, setJobLauncherAddress] = useState<string>();
  const [minFee, setMinFee] = useState<number>(0.01);

  useEffect(() => {
    const fetchJobLauncherData = async () => {
      const address = await paymentService.getOperatorAddress();
      const fee = await paymentService.getFee();
      setJobLauncherAddress(address);
      setMinFee(fee);
    };

    fetchJobLauncherData();
  }, []);

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

  const fundAmount = paymentData.amount ? Number(paymentData.amount) : 0;
  const feeAmount = Math.max(
    minFee,
    fundAmount * (Number(jobLauncherFee) / 100),
  );
  const totalAmount = fundAmount + feeAmount;
  const accountAmount = user?.balance ? Number(user?.balance?.amount) : 0;

  const balancePayAmount = useMemo(() => {
    if (!payWithAccountBalance) return 0;
    if (totalAmount < accountAmount) return totalAmount;
    return accountAmount;
  }, [payWithAccountBalance, totalAmount, accountAmount]);

  const creditCardPayAmount = useMemo(() => {
    if (!payWithAccountBalance) return totalAmount;
    if (totalAmount < accountAmount) return 0;
    return totalAmount - accountAmount;
  }, [payWithAccountBalance, totalAmount, accountAmount]);

  const cardElementsDisabled = useMemo(() => {
    if (paymentData.amount) {
      return creditCardPayAmount <= 0;
    } else {
      if (payWithAccountBalance) return true;
      return false;
    }
  }, [paymentData, payWithAccountBalance, creditCardPayAmount]);

  const handlePaymentDataFormFieldChange = (
    fieldName: string,
    fieldValue: any,
  ) => {
    setPaymentData({ ...paymentData, [fieldName]: fieldValue });
  };

  const handlePay = async () => {
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      // eslint-disable-next-line no-console
      console.error('Stripe.js has not yet loaded.');
      return;
    }

    setIsLoading(true);

    try {
      if (creditCardPayAmount > 0) {
        if (!paymentData.name) {
          throw new Error('Please enter name on card.');
        }

        // Stripe elements validation
        const cardNumber = elements.getElement(CardNumberElement) as any;
        const cardExpiry = elements.getElement(CardExpiryElement) as any;
        const cardCvc = elements.getElement(CardCvcElement) as any;

        if (!cardNumber || !cardExpiry || !cardCvc) {
          throw new Error('Card elements are not initialized');
        }
        if (cardNumber._invalid || cardNumber._empty) {
          throw new Error('Your card number is incomplete.');
        }
        if (cardExpiry._invalid || cardExpiry._empty) {
          throw new Error("Your card's expiration date is incomplete.");
        }
        if (cardCvc._invalid || cardCvc._empty) {
          throw new Error("Your card's security code is incomplete.");
        }

        // send payment if creditCardPayment > 0
        const clientSecret = await paymentService.createFiatPayment({
          amount: creditCardPayAmount,
          currency: CURRENCY.usd,
        });

        // stripe payment
        const { error: stripeError, paymentIntent } =
          await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: cardNumber,
              billing_details: {
                name: paymentData.name,
              },
            },
          });
        if (stripeError) {
          throw stripeError;
        }

        // confirm payment
        const success = await paymentService.confirmFiatPayment(
          paymentIntent.id,
        );

        if (!success) {
          throw new Error('Payment confirmation failed.');
        }
      }

      // create job
      const { jobType, chainId, fortuneRequest, cvatRequest, hCaptchaRequest } =
        jobRequest;
      if (!chainId) return;

      if (jobType === JobType.Fortune && fortuneRequest) {
        await jobService.createFortuneJob(
          chainId,
          fortuneRequest,
          fundAmount,
          CURRENCY.usd,
        );
      } else if (jobType === JobType.CVAT && cvatRequest) {
        await jobService.createCvatJob(
          chainId,
          cvatRequest,
          fundAmount,
          CURRENCY.usd,
        );
      } else if (jobType === JobType.HCAPTCHA && hCaptchaRequest) {
        await jobService.createHCaptchaJob(chainId, hCaptchaRequest);
      }

      dispatch(fetchUserBalanceAsync());
      onFinish();
    } catch (err) {
      onError(err);
    }

    setIsLoading(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={4} mb={6} sx={{ width: '100%' }}>
        <Grid item xs={12} sm={12} md={6}>
          <Grid container spacing={4} sx={{ width: '100%' }}>
            <Grid item xs={12}>
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
                      onChange={(e) =>
                        setPayWithAccountBalance(e.target.checked)
                      }
                    />
                  }
                  label="I want to pay with my account balance"
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <StripeElement disabled={cardElementsDisabled}>
                <CardNumberElement id="card-number" />
              </StripeElement>
            </Grid>
            <Grid item xs={12} sm={6}>
              <StripeElement disabled={cardElementsDisabled}>
                <CardExpiryElement id="card-expiry" />
              </StripeElement>
            </Grid>
            <Grid item xs={12} sm={6}>
              <StripeElement disabled={cardElementsDisabled}>
                <CardCvcElement id="card-cvc" />
              </StripeElement>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Name on Card"
                value={paymentData.name}
                onChange={(e) =>
                  handlePaymentDataFormFieldChange('name', e.target.value)
                }
                disabled={cardElementsDisabled}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <TextField
                  fullWidth
                  placeholder="Amount USD"
                  variant="outlined"
                  value={paymentData.amount}
                  type="number"
                  onChange={(e) =>
                    handlePaymentDataFormFieldChange('amount', e.target.value)
                  }
                />
              </FormControl>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Box
            sx={{
              borderRadius: '8px',
              background: '#F9FAFF',
              px: 4,
              py: 1.5,
              height: '100%',
              boxSizing: 'border-box',
            }}
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
              {user?.balance && (
                <Typography color="text.secondary">
                  {user?.balance?.amount?.toFixed(2)} USD
                </Typography>
              )}
            </Box>
            {/* <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 2,
                borderBottom: '1px solid #E5E7EB',
              }}
            >
              <Typography>Amount due</Typography>
              <Typography color="text.secondary">{totalAmount} USD</Typography>
            </Box> */}
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
                ({Number(jobLauncherFee)}%) {feeAmount.toFixed(2)} USD
              </Typography>
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
                  <Typography color="text.secondary">
                    {balancePayAmount.toFixed(2)} USD
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">Credit Card</Typography>
                  <Typography color="text.secondary">
                    {creditCardPayAmount.toFixed(2)} USD
                  </Typography>
                </Stack>
                {/* <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">Fees</Typography>
                  <Typography color="text.secondary">
                    ({JOB_LAUNCHER_FEE}%) {feeAmount} USD
                  </Typography>
                </Stack> */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography>Total</Typography>
                  <Typography>{totalAmount.toFixed(2)} USD</Typography>
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
            loading={isLoading}
            disabled={!paymentData.amount}
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

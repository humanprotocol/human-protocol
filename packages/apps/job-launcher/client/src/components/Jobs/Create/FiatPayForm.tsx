import KVStoreABI from '@human-protocol/core/abis/KVStore.json';
import { KVStoreKeys, NETWORKS } from '@human-protocol/sdk';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useElements, useStripe } from '@stripe/react-stripe-js';
import { useEffect, useMemo, useState } from 'react';

import { Address } from 'viem';
import { useReadContract } from 'wagmi';
import AddCardModal from '../../../components/CreditCard/AddCardModal';
import SelectCardModal from '../../../components/CreditCard/SelectCardModal';
import { CardIcon } from '../../../components/Icons/CardIcon';
import SuccessModal from '../../../components/SuccessModal';
import { CURRENCY } from '../../../constants/payment';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import { useSnackbar } from '../../../providers/SnackProvider';
import {
  createCvatJob,
  createFortuneJob,
  createHCaptchaJob,
} from '../../../services/job';
import {
  confirmFiatPayment,
  createFiatPayment,
  getFee,
  getOperatorAddress,
  getUserBillingInfo,
  getUserCards,
} from '../../../services/payment';
import { useAppDispatch, useAppSelector } from '../../../state';
import { fetchUserBalanceAsync } from '../../../state/auth/reducer';
import { CardData, JobType } from '../../../types';
import BillingDetailsModal from '../../BillingDetails/BillingDetailsModal';

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
  const { showError } = useSnackbar();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [jobLauncherAddress, setJobLauncherAddress] = useState<string>();
  const [minFee, setMinFee] = useState<number>(0.01);
  const [cards, setCards] = useState<CardData[]>([]);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [isSelectCardModalOpen, setIsSelectCardModalOpen] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [payWithAccountBalance, setPayWithAccountBalance] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { jobRequest, goToPrevStep } = useCreateJobPageUI();
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isBillingDetailsOpen, setIsBillingDetailsOpen] = useState(false);
  const [openBillingAfterAddCard, setOpenBillingAfterAddCard] = useState(false);
  const [fundAmount, setFundAmount] = useState(0);
  const [feeAmount, setFeeAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [balancePayAmount, setBalancePayAmount] = useState(0);
  const [creditCardPayAmount, setCreditCardPayAmount] = useState(0);
  const [accountAmount] = useState(
    user?.balance ? Number(user?.balance?.amount) : 0,
  );

  useEffect(() => {
    const fetchJobLauncherData = async () => {
      const address = await getOperatorAddress();
      const fee = await getFee();
      setJobLauncherAddress(address);
      setMinFee(fee);
    };

    const fetchBillingInfo = async () => {
      try {
        const data = await getUserBillingInfo();
        if (!data || !data.name || !data.address)
          setOpenBillingAfterAddCard(true);
      } catch {
        setOpenBillingAfterAddCard(true);
      }
    };

    fetchJobLauncherData();
    fetchCards();
    fetchBillingInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCards = async () => {
    setLoadingInitialData(true);
    const data = await getUserCards();
    setCards(data);

    const defaultCard = data.find((card: CardData) => card.default);
    if (defaultCard) {
      setSelectedCard(defaultCard);
    }
    setLoadingInitialData(false);
  };
  const {
    data: jobLauncherFee,
    error,
    isError,
  } = useReadContract({
    address: NETWORKS[jobRequest.chainId!]?.kvstoreAddress as Address,
    abi: KVStoreABI,
    functionName: 'get',
    args: jobLauncherAddress
      ? [jobLauncherAddress, KVStoreKeys.fee]
      : undefined,
    query: {
      enabled: !!jobLauncherAddress,
    },
    chainId: jobRequest.chainId,
  });

  useEffect(() => {
    if (isError && error) {
      showError(`Error getting fee, please try again`);
      setHasError(true);
    } else {
      setHasError(false);
    }
  }, [isError, error, showError]);

  useMemo(() => {
    setFundAmount(amount ? Number(amount) : 0);
    if (Number(jobLauncherFee) >= 0)
      setFeeAmount(
        Math.max(minFee, fundAmount * (Number(jobLauncherFee) / 100)),
      );
    setTotalAmount(fundAmount + feeAmount);
    if (!payWithAccountBalance) setBalancePayAmount(0);
    else if (totalAmount < accountAmount) setBalancePayAmount(totalAmount);
    else setBalancePayAmount(accountAmount);

    if (!payWithAccountBalance) setCreditCardPayAmount(totalAmount);
    else if (totalAmount < accountAmount) setCreditCardPayAmount(0);
    else setCreditCardPayAmount(totalAmount - accountAmount);
  }, [
    accountAmount,
    amount,
    feeAmount,
    fundAmount,
    jobLauncherFee,
    minFee,
    payWithAccountBalance,
    totalAmount,
  ]);

  const handleSuccessAction = (message: string) => {
    setSuccessMessage(message);
    setIsSuccessOpen(true);
  };

  const handlePay = async () => {
    if (!stripe || !elements) {
      onError('Stripe.js has not yet loaded.');
      return;
    }

    onStart();
    setIsLoading(true);

    try {
      if (creditCardPayAmount > 0 && selectedCard) {
        const clientSecret = await createFiatPayment({
          amount: creditCardPayAmount,
          currency: 'usd',
          paymentMethodId: selectedCard.id,
        });

        const { error: stripeError, paymentIntent } =
          await stripe.confirmCardPayment(clientSecret);

        if (stripeError) {
          throw stripeError;
        }

        const success = await confirmFiatPayment(paymentIntent.id);

        if (!success) {
          throw new Error('Payment confirmation failed.');
        }
      }

      // create job
      const { jobType, chainId, fortuneRequest, cvatRequest, hCaptchaRequest } =
        jobRequest;
      if (!chainId) return;

      if (jobType === JobType.Fortune && fortuneRequest) {
        await createFortuneJob(
          chainId,
          fortuneRequest,
          fundAmount,
          CURRENCY.usd,
        );
      } else if (jobType === JobType.CVAT && cvatRequest) {
        await createCvatJob(chainId, cvatRequest, fundAmount, CURRENCY.usd);
      } else if (jobType === JobType.HCAPTCHA && hCaptchaRequest) {
        await createHCaptchaJob(chainId, hCaptchaRequest);
      }

      // Update balance and finish payment
      dispatch(fetchUserBalanceAsync());
      onFinish();
    } catch (err) {
      onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {loadingInitialData ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={400}
        >
          <CircularProgress />
        </Box>
      ) : (
        <Box>
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
                  <FormControl fullWidth>
                    <TextField
                      fullWidth
                      placeholder="Amount USD"
                      variant="outlined"
                      value={amount}
                      type="number"
                      onChange={(e) => setAmount(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    {selectedCard ? (
                      <TextField
                        label="Payment Method"
                        variant="outlined"
                        fullWidth
                        value={`**** **** **** ${selectedCard.last4}`}
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              <CardIcon fontSize="medium" sx={{ marginX: 2 }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Button
                                variant="contained"
                                onClick={() => setIsSelectCardModalOpen(true)}
                                size="small"
                              >
                                Change
                              </Button>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 2 }}
                      />
                    ) : (
                      <Button
                        variant="contained"
                        onClick={() => setIsAddCardOpen(true)}
                        size="large"
                        sx={{ mb: 2 }}
                        disabled={payWithAccountBalance}
                      >
                        Add Payment Method
                      </Button>
                    )}
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
                    (
                    {Number(jobLauncherFee) >= 0
                      ? `${Number(jobLauncherFee)}%`
                      : 'loading...'}
                    ) {feeAmount.toFixed(2)} USD
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
                      <Typography color="text.secondary">
                        Credit Card
                      </Typography>
                      <Typography color="text.secondary">
                        {creditCardPayAmount.toFixed(2)} USD
                      </Typography>
                    </Stack>
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
                disabled={
                  !amount ||
                  (!payWithAccountBalance && !selectedCard) ||
                  hasError
                }
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

            <SelectCardModal
              open={isSelectCardModalOpen}
              onClose={() => setIsSelectCardModalOpen(false)}
              cards={cards}
              onSelect={(card) => {
                setSelectedCard(card);
                setIsSelectCardModalOpen(false);
              }}
            />
            <AddCardModal
              open={isAddCardOpen}
              onClose={() => setIsAddCardOpen(false)}
              onComplete={() => {
                handleSuccessAction('Your card has been successfully added.');
                fetchCards();
              }}
            />
            <SuccessModal
              open={isSuccessOpen}
              onClose={() => {
                if (openBillingAfterAddCard) {
                  setIsBillingDetailsOpen(true);
                }
                setIsSuccessOpen(false);
              }}
              message={successMessage}
            />

            <BillingDetailsModal
              open={isBillingDetailsOpen}
              onClose={() => {
                setIsBillingDetailsOpen(false);
                setOpenBillingAfterAddCard(false);
              }}
              billingInfo={{
                name: '',
                email: '',
                address: {
                  city: '',
                  country: '',
                  postalCode: '',
                  line: '',
                },
                vat: '',
                vatType: '',
              }}
              setBillingInfo={(info) => {
                handleSuccessAction(
                  'Your billing details have been successfully updated.',
                );
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FiatPayForm;

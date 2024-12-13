import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { useElements, useStripe } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import { useSnackbar } from '../../providers/SnackProvider';
import * as paymentService from '../../services/payment';
import { useAppDispatch } from '../../state';
import { fetchUserBalanceAsync } from '../../state/auth/reducer';
import { CardData } from '../../types';
import BillingDetailsModal from '../BillingDetails/BillingDetailsModal';
import AddCardModal from '../CreditCard/AddCardModal';
import SelectCardModal from '../CreditCard/SelectCardModal';
import { CardIcon } from '../Icons/CardIcon';
import SuccessModal from '../SuccessModal';
import { TopUpSuccess } from './TopUpSuccess';

export const FiatTopUpForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [amount, setAmount] = useState<string>();
  const dispatch = useAppDispatch();
  const { showError } = useSnackbar();
  const [cards, setCards] = useState<CardData[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [isSelectCardModalOpen, setIsSelectCardModalOpen] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [openBillingAfterAddCard, setOpenBillingAfterAddCard] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isBillingDetailsOpen, setIsBillingDetailsOpen] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);

  useEffect(() => {
    const fetchBillingInfo = async () => {
      try {
        const data = await paymentService.getUserBillingInfo();
        if (!data || !data.name || !data.address)
          setOpenBillingAfterAddCard(true);
      } catch {
        setOpenBillingAfterAddCard(true);
      }
    };

    fetchCards();
    fetchBillingInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCards = async () => {
    setLoadingInitialData(true);
    const data = await paymentService.getUserCards();
    setCards(data);

    const defaultCard = data.find((card: CardData) => card.default);
    if (defaultCard) {
      setSelectedCard(defaultCard);
    }
    setLoadingInitialData(false);
  };

  const handleSuccessAction = (message: string) => {
    setSuccessMessage(message);
    setIsSuccessOpen(true);
  };

  const handleTopUpAccount = async () => {
    if (!stripe || !elements || !selectedCard) {
      showError('Stripe.js has not yet loaded.');
      return;
    }
    // Trigger form validation and wallet collection
    const { error: submitError } = await elements.submit();
    if (submitError) {
      showError(submitError);
      return;
    }

    setIsLoading(true);
    try {
      // get client secret
      const clientSecret = await paymentService.createFiatPayment({
        amount: Number(amount),
        currency: 'usd',
        paymentMethodId: selectedCard.id,
      });

      // stripe payment
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret);

      if (stripeError) {
        throw stripeError;
      }

      // confirm payment
      const success = await paymentService.confirmFiatPayment(paymentIntent.id);

      if (!success) {
        throw new Error('Payment confirmation failed.');
      }

      dispatch(fetchUserBalanceAsync());

      setIsSuccess(true);
    } catch (err: any) {
      showError(err.message || 'An error occurred while setting up the card.');
      setIsSuccess(false);
    }
    setIsLoading(false);
  };

  return isSuccess ? (
    <TopUpSuccess />
  ) : (
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
          <Grid container spacing={4}>
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
                  >
                    Add Payment Method
                  </Button>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <LoadingButton
                color="primary"
                variant="contained"
                fullWidth
                size="large"
                onClick={handleTopUpAccount}
                loading={isLoading}
                disabled={!amount || !selectedCard}
              >
                Top up account
              </LoadingButton>
            </Grid>
            <Grid item xs={12}>
              <Link
                href="https://humanprotocol.org/app/terms-and-conditions"
                target="_blank"
              >
                <Typography variant="caption" component="p" textAlign="center">
                  Terms & conditions
                </Typography>
              </Link>
            </Grid>
          </Grid>

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
            onClose={() => setIsBillingDetailsOpen(false)}
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
      )}
    </Box>
  );
};

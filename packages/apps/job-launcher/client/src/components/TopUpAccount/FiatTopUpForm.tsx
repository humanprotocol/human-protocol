import { LoadingButton } from '@mui/lab';
import {
  Box,
  FormControl,
  Grid,
  Link,
  TextField,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import React, { useState } from 'react';
import * as paymentService from '../../services/payment';
import { useAppDispatch } from '../../state';
import { fetchUserBalanceAsync } from '../../state/auth/reducer';
import { TopUpSuccess } from './TopUpSuccess';

export const FiatTopUpForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [amount, setAmount] = useState<string>();
  const [name, setName] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  const handleTopUpAccount = async () => {
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      console.error('Stripe.js has not yet loaded.');
      return;
    }

    setIsLoading(true);
    try {
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

      // get client secret
      const clientSecret = await paymentService.createFiatPayment({
        amount: Number(amount),
        currency: 'usd',
      });

      // stripe payment
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardNumber,
            billing_details: { name },
          },
        });

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
    } catch (err) {
      setErrorMessage(err.message);
      setIsSuccess(false);
    }
    setIsLoading(false);
  };

  return isSuccess ? (
    <TopUpSuccess />
  ) : (
    <Box>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Box
            sx={{
              border: '1px solid #320A8D',
              borderRadius: '4px',
              height: '56px',
              padding: '18px 16px',
            }}
          >
            <CardNumberElement id="card-number" />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box
            sx={{
              border: '1px solid #320A8D',
              borderRadius: '4px',
              height: '56px',
              padding: '18px 16px',
            }}
          >
            <CardExpiryElement id="card-expiry" />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box
            sx={{
              border: '1px solid #320A8D',
              borderRadius: '4px',
              height: '56px',
              padding: '18px 16px',
            }}
          >
            <CardCvcElement id="card-cvc" />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Name on Card"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
            />
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
            disabled={!amount || !name}
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
      <Snackbar
        open={errorMessage !== null}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setErrorMessage(null)} severity="error">
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

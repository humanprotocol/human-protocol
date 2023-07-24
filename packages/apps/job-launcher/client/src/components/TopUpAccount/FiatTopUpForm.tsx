import {
  Box,
  Button,
  FormControl,
  Grid,
  Link,
  TextField,
  Typography,
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
import { TopUpSuccess } from './TopUpSuccess';

export const FiatTopUpForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSuccess, setIsSuccess] = useState(false);
  const [amount, setAmount] = useState<string>();

  const handleTopUpAccount = async () => {
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      console.error('Stripe.js has not yet loaded.');
      return;
    }

    if (!amount) return;

    try {
      // get client secret
      const clientSecret = await paymentService.createFiatPayment({
        amount: Number(amount),
        currency: 'usd',
      });

      const cardNumber = elements.getElement(CardNumberElement);
      const cardExpiry = elements.getElement(CardExpiryElement);
      const cardCvc = elements.getElement(CardCvcElement);
      if (!cardNumber || !cardExpiry || !cardCvc) {
        return;
      }

      // stripe payment
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardNumber,
            // billing_details: {
            //   name: paymentData.name,
            // },
          },
        });
      if (stripeError) {
        console.error(stripeError);
        return;
      }

      // confirm payment
      const success = await paymentService.confirmFiatPayment(paymentIntent.id);

      if (!success) {
        console.error('Payment confirmation error');
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
    }
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
          <FormControl fullWidth>
            <TextField
              fullWidth
              placeholder="Amount USD"
              variant="outlined"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Button
            color="primary"
            variant="contained"
            fullWidth
            size="large"
            onClick={handleTopUpAccount}
          >
            Top up account
          </Button>
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
    </Box>
  );
};

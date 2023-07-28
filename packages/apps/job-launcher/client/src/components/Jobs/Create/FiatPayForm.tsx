import {
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
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import React, { useState } from 'react';
import { useTokenRate } from '../../../hooks/useTokenRate';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import * as jobService from '../../../services/job';
import * as paymentService from '../../../services/payment';
import { useAppSelector } from '../../../state';
import { JobType } from '../../../types';

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
  const { jobRequest } = useCreateJobPageUI();
  const rate = useTokenRate('hmt', 'usd');
  const { user } = useAppSelector((state) => state.auth);

  const [paymentData, setPaymentData] = useState({
    amount: '',
    name: '',
  });

  const handlePaymentDataFormFieldChange = (
    fieldName: string,
    fieldValue: any
  ) => {
    setPaymentData({ ...paymentData, [fieldName]: fieldValue });
  };

  const handlePay = async () => {
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      console.error('Stripe.js has not yet loaded.');
      return;
    }

    try {
      // get client secret
      const clientSecret = await paymentService.createFiatPayment({
        amount: Number(paymentData.amount),
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
            billing_details: {
              name: paymentData.name,
            },
          },
        });
      if (stripeError) {
        onError(stripeError);
        return;
      }

      // confirm payment
      const success = await paymentService.confirmFiatPayment(paymentIntent.id);

      if (!success) {
        onError({ message: 'Payment confirmation error' });
        return;
      }

      const tokenAmount = Number(paymentData.amount) / rate;

      // create job
      const { jobType, chainId, fortuneRequest, annotationRequest } =
        jobRequest;
      if (jobType === JobType.Fortune && fortuneRequest) {
        await jobService.createFortuneJob(chainId, fortuneRequest, tokenAmount);
      } else if (jobType === JobType.Annotation && annotationRequest) {
        await jobService.createAnnotationJob(
          chainId,
          annotationRequest,
          tokenAmount
        );
      }
      onFinish();
    } catch (err) {
      console.error(err);
      onError(err);
    }
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
                  control={<Checkbox defaultChecked />}
                  label="I want to pay with my account balance"
                />
              </Box>
            </Grid>
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Name on Card"
                value={paymentData.name}
                onChange={(e) =>
                  handlePaymentDataFormFieldChange('name', e.target.value)
                }
              />
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
                  value={paymentData.amount}
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
                  <Typography color="text.secondary">Credit Card</Typography>
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
        <Button
          color="primary"
          variant="contained"
          sx={{ width: '400px' }}
          size="large"
          onClick={handlePay}
        >
          Pay now
        </Button>
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

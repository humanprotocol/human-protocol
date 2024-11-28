import { LoadingButton } from '@mui/lab';
import { Box, Checkbox, FormControlLabel, Grid } from '@mui/material';
import {
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { useState } from 'react';
import { useSnackbar } from '../../providers/SnackProvider';
import * as paymentService from '../../services/payment';
import { useAppDispatch } from '../../state';
import { fetchUserBalanceAsync } from '../../state/auth/reducer';

interface CardSetupFormProps {
  onComplete: () => void;
}

export const CardSetupForm: React.FC<CardSetupFormProps> = ({ onComplete }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const [defaultCard, setDefaultCard] = useState(false);
  const dispatch = useAppDispatch();
  const { showError } = useSnackbar();

  const handleCardSetup = async () => {
    if (!stripe || !elements) {
      showError('Stripe.js has not yet loaded.');
      return;
    }

    // Trigger form validation and card details collection
    const { error: submitError } = await elements.submit();
    if (submitError) {
      showError(submitError);
      return;
    }

    setIsLoading(true);
    try {
      const clientSecret = await paymentService.createSetupIntent();

      if (!clientSecret) {
        throw new Error('Failed to create SetupIntent.');
      }

      const { error: stripeError, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        throw stripeError;
      }

      const success = await paymentService.confirmSetupIntent(
        setupIntent?.id ?? '',
        defaultCard,
      );

      if (!success) {
        throw new Error('Card setup confirmation failed.');
      }

      dispatch(fetchUserBalanceAsync());
      onComplete();
    } catch (err: any) {
      showError(err.message || 'An error occurred while setting up the card.');
    }
    setIsLoading(false);
  };

  return (
    <Box>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <PaymentElement
            options={{
              fields: { billingDetails: { name: 'auto' } },
            }}
          />

          <FormControlLabel
            control={
              <Checkbox
                defaultChecked
                checked={defaultCard}
                onChange={(e) => setDefaultCard(e.target.checked)}
              />
            }
            label="Set this card as default payment method"
            sx={{ mt: 2 }}
          />
        </Grid>
        <Grid item xs={12}>
          <LoadingButton
            color="primary"
            variant="contained"
            fullWidth
            size="large"
            onClick={handleCardSetup}
            loading={isLoading}
          >
            Add Credit Card
          </LoadingButton>
        </Grid>
      </Grid>
    </Box>
  );
};

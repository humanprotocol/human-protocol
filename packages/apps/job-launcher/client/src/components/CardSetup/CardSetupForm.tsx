import { LoadingButton } from '@mui/lab';
import { Box, Grid, Link, Typography } from '@mui/material';
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
  onCardSetup: () => void; // Prop para notificar cuando la tarjeta está lista
}

export const CardSetupForm: React.FC<CardSetupFormProps> = ({
  onCardSetup,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
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
      );

      if (!success) {
        throw new Error('Card setup confirmation failed.');
      }

      dispatch(fetchUserBalanceAsync());
      onCardSetup();
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
            options={{ fields: { billingDetails: { name: 'auto' } } }}
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
            Save card details
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
    </Box>
  );
};

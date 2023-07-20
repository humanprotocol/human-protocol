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
import React from 'react';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';

export const FiatPayForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { goToNextStep } = useCreateJobPageUI();

  console.log(stripe, elements);

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
              <Typography color="text.secondary">100 USD</Typography>
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
          onClick={() => goToNextStep?.()}
        >
          Pay now
        </Button>
        <Link href="https://humanprotocol.org" target="_blank">
          <Typography variant="caption" mt={4} component="p">
            Terms & conditions
          </Typography>
        </Link>
      </Box>
    </Box>
  );
};

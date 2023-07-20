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
} from '@stripe/react-stripe-js';
import React, { useState } from 'react';
import { TopUpSuccess } from './TopUpSuccess';

export const FiatTopUpForm = () => {
  const [isSuccess, setIsSuccess] = useState(false);
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
            <TextField fullWidth placeholder="Amount USD" variant="outlined" />
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Button
            color="primary"
            variant="contained"
            fullWidth
            size="large"
            onClick={() => setIsSuccess(true)}
          >
            Top up account
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Link href="https://humanprotocol.org" target="_blank">
            <Typography variant="caption" component="p" textAlign="center">
              Terms & conditions
            </Typography>
          </Link>
        </Grid>
      </Grid>
    </Box>
  );
};

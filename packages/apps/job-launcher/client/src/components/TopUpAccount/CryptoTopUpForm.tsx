import {
  Alert,
  Box,
  Button,
  FormControl,
  Grid,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { TokenSelect } from '../../components/TokenSelect';
import { TopUpSuccess } from './TopUpSuccess';

export const CryptoTopUpForm = () => {
  const [isSuccess, setIsSuccess] = useState(false);

  return isSuccess ? (
    <TopUpSuccess />
  ) : (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={4} mb={6} sx={{ width: '100%' }}>
        <Grid item xs={12} sm={12} md={6}>
          <Box
            sx={{
              height: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '30px',
            }}
          >
            <Alert variant="outlined" severity="success">
              Your wallet is connected
            </Alert>
            <TokenSelect />
            <FormControl fullWidth>
              <TextField placeholder="Amount" />
            </FormControl>
          </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Box
            sx={{ borderRadius: '8px', background: '#F9FAFF', px: 4, py: 1.5 }}
          >
            <Box sx={{ py: 2 }}>
              <Typography mb={1}>Transaction details</Typography>
              <Stack
                direction="column"
                spacing={1}
                sx={{
                  borderBottom: '1px solid #E5E7EB',
                  pb: 2,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">HMT Price</Typography>
                  <Typography color="text.secondary">0.15 USD</Typography>
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">Fees</Typography>
                  <Typography color="text.secondary">(3.1%) 9.3 USD</Typography>
                </Stack>
              </Stack>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ py: 2 }}
              >
                <Typography>You receive</Typography>
                <Typography>0 HMT</Typography>
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
          onClick={() => setIsSuccess(true)}
        >
          Top up account
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

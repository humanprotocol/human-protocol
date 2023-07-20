import {
  Alert,
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
import React from 'react';
import { TokenSelect } from '../../../components/TokenSelect';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';

export const CryptoPayForm = () => {
  const { goToNextStep } = useCreateJobPageUI();

  return (
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
                  <Typography color="text.secondary">Crypto Wallet</Typography>
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

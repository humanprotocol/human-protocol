import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import React, { Dispatch, useState } from 'react';
import { ChainId, ESCROW_NETWORKS, TESTNET_CHAIN_IDS } from 'src/constants';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export const RequestData = ({
  step,
  setStep,
  setTxHash,
}: {
  step: number;
  setStep: Dispatch<number>;
  setTxHash: Dispatch<string>;
}) => {
  const [chainId, setChainId] = useState<ChainId>(ChainId.POLYGON_MUMBAI);
  const [address, setAddress] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async () => {
    setStep(1);
    const payload = { address: address, chainId: chainId };
    const response = await fetch(
      `${process.env.REACT_APP_FAUCET_SERVER_API}/faucet`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    if (!result.status) {
      setError(result.message);
      setStep(0);
    } else {
      setTxHash(result.txHash);
      setStep(2);
    }
  };

  return (
    <Paper>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={error.length > 0}
        autoHideDuration={3000}
        onClose={() => setError('')}
      >
        <Alert
          onClose={() => setError('')}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
      <Grid
        container
        justifyContent="center"
        direction="column"
        sx={{
          padding: { xs: 2, sm: 2, md: 10, lg: 10 },
          minWidth: 600,
        }}
      >
        <Grid item container direction="row" alignItems="center">
          <FormControl fullWidth disabled={step === 1}>
            <InputLabel>Network</InputLabel>
            <Select
              label="Network"
              variant="outlined"
              value={chainId}
              onChange={(e) => setChainId(Number(e.target.value))}
            >
              {TESTNET_CHAIN_IDS.map((chainId) => (
                <MenuItem key={chainId} value={chainId}>
                  {ESCROW_NETWORKS[chainId]?.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid
          item
          container
          direction="row"
          alignItems="center"
          sx={{
            marginTop: { xs: 1, sm: 1, md: 5, lg: 5 },
          }}
        >
          <TextField
            fullWidth
            id="outlined-basic"
            label="Address"
            variant="outlined"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={step === 1}
          />
        </Grid>
        <Grid
          item
          container
          direction="row"
          justifyContent="center"
          alignItems="flex-end"
          sx={{
            marginTop: { xs: 1, sm: 1, md: 5, lg: 5 },
          }}
        >
          <Button
            fullWidth
            onClick={handleSubmit}
            variant="contained"
            disabled={step === 1}
            sx={{
              '&.Mui-disabled': {
                background: '#2F0087',
                color: '#FFFFFF',
              },
            }}
          >
            {step === 1 ? 'Sending tokens' : 'Send me'}
          </Button>
        </Grid>
        <Grid
          item
          container
          direction="row"
          justifyContent="center"
          alignItems="flex-end"
          sx={{
            marginTop: { xs: 1, sm: 1, md: 5, lg: 5 },
          }}
        >
          <Typography
            variant="body2"
            sx={
              step === 1
                ? {
                    fontWeight: 'bold',
                    color: (theme) => theme.palette.text.disabled,
                  }
                : {
                    fontWeight: 'bold',
                  }
            }
          >
            Contract address:
          </Typography>
        </Grid>

        <Grid
          item
          container
          direction="row"
          justifyContent="center"
          alignItems="flex-end"
        >
          <Typography
            variant="body2"
            sx={
              step === 1
                ? {
                    mt: 1,
                    color: (theme) => theme.palette.text.disabled,
                  }
                : {
                    mt: 1,
                  }
            }
          >
            {ESCROW_NETWORKS[chainId]?.hmtAddress}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

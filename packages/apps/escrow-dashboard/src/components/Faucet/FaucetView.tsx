import {
  Box,
  Grid,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { ChainId, ESCROW_NETWORKS, IEscrowNetwork } from '../../constants';
import { RequestData } from './RequestData';
import { Success } from './Success';
const steps = ['Wallet Address', 'Send Test tokens', 'Confirmation'];

export const FaucetView = (): React.ReactElement => {
  const [step, setStep] = useState<number>(0);
  const [txHash, setTxHash] = useState<string>('');
  const [network, setNetwork] = useState<IEscrowNetwork>(
    ESCROW_NETWORKS[ChainId.POLYGON_MUMBAI]!
  );
  return (
    <Grid container>
      <Grid
        item
        xs={12}
        sm={12}
        md={12}
        container
        direction="row"
        justifyContent="center"
      >
        <Grid
          item
          xs={12}
          sm={12}
          md={12}
          container
          direction="column"
          justifyContent="center"
          alignItems="center"
        >
          <Box>
            <Typography variant="h4" sx={{ marginBottom: 2 }} color="primary">
              HUMAN Faucet for testnet
            </Typography>
            <Paper sx={{ padding: { md: 2 }, marginBottom: 2 }}>
              {' '}
              <Box sx={{ width: '100%' }}>
                <Stepper activeStep={step}>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            </Paper>

            {step < 2 && (
              <RequestData
                step={step}
                setStep={setStep}
                setTxHash={setTxHash}
                network={network}
                setNetwork={setNetwork}
              />
            )}
            {step === 2 && <Success txHash={txHash} network={network} />}
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};

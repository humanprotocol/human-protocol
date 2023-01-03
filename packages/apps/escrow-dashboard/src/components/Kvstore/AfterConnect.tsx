import {
  Grid,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
} from '@mui/material';
import React, { useState } from 'react';
import { GenerateOrImport } from './GenerateOrImport';
import { GeneratePubkey } from './GeneratePubkey';
import { SuccessGenerate } from './SuccessGenerate';
import { ImportPubkey } from './ImportPubkey';
import { CustomConnectButton } from './CustomConnectButton';
const steps = ['Get Public Key', 'Add Public Key', 'Empower Human Scan'];
export const AfterConnect = (): React.ReactElement => {
  const [step, setStep] = useState<number>(0);
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
              ETH KV Store
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
            {step === 0 && <GenerateOrImport setStep={setStep} />}
            {step === 1 && <GeneratePubkey setStep={setStep} />}
            {/*<SuccessGenerate/>*/}
            {step === 2 && <ImportPubkey setStep={setStep} />}
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};

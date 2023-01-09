import {
  Grid,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import React, { useState } from 'react';
import { GenerateOrImport } from './GenerateOrImport';
import { GeneratePubkey } from './GeneratePubkey';
import { Success } from './Success';
import { ImportPubkey } from './ImportPubkey';
import {Key} from './index'
const steps = ['Get Public Key', 'Add Public Key', 'Empower Human Scan'];

export const AfterConnect = (): React.ReactElement => {
  const [step, setStep] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [key, setKey] = useState<Key>({ publicKey: '', privateKey: '' });
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
              {page === 0 && <GenerateOrImport setStep={setStep} setPage={setPage} />}
              {page === 1 && <GeneratePubkey setKey={setKey} setStep={setStep} setPage={setPage} />}
              {page === 1.5 && <Success what="generated" keys={key}  setStep={setStep} setPage={setPage} />}
              {page === 2 && <ImportPubkey setKey={setKey} setStep={setStep} setPage={setPage}/>}
              {page === 2.5 && <Success what="imported" keys={key}  setStep={setStep} setPage={setPage} />}
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};

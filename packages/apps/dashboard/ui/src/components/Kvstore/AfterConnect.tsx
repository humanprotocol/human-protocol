import {
  Box,
  Grid,
  Paper,
  Step,
  Stepper,
  StepLabel,
  Typography,
} from '@mui/material';
import { useState, Dispatch, FC } from 'react';

import { STEPS } from './constants';
import { Empower } from './Empower';
import { GenerateOrImport } from './GenerateOrImport';
import { GeneratePubkey } from './GeneratePubkey';
import { ImportPubkey } from './ImportPubkey';
import { Success } from './Success';
import { Key } from './types';

type StepPage = {
  step: number;
  setStep: Dispatch<number>;
  page: number;
  setPage: Dispatch<number>;
};

export type AfterConnectProps = {
  pubkeyExist: boolean;
  refetch: any;
  setPublicKey: Dispatch<string>;
} & StepPage;

export const AfterConnect: FC<AfterConnectProps> = ({
  step,
  setStep,
  page,
  setPage,
  pubkeyExist,
  refetch,
  setPublicKey,
}) => {
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
                  {STEPS.map((step) => (
                    <Step key={step}>
                      <StepLabel>{step}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            </Paper>

            {page === 0 && (
              <GenerateOrImport setStep={setStep} setPage={setPage} />
            )}
            {page === 1 && (
              <GeneratePubkey
                refetch={refetch}
                setPublicKey={setPublicKey}
                pubkeyExist={pubkeyExist}
                setKey={setKey}
                setStep={setStep}
                setPage={setPage}
              />
            )}
            {page === 1.5 && (
              <Success
                what="generated"
                keys={key}
                setStep={setStep}
                setPage={setPage}
              />
            )}
            {page === 2 && (
              <ImportPubkey
                refetch={refetch}
                setPublicKey={setPublicKey}
                pubkeyExist={pubkeyExist}
                setKey={setKey}
                setStep={setStep}
                setPage={setPage}
              />
            )}
            {page === 2.5 && (
              <Success
                what="imported"
                keys={key}
                setStep={setStep}
                setPage={setPage}
              />
            )}
            {page === 3 && (
              <Empower refetch={refetch} setPublicKey={setPublicKey} />
            )}
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};

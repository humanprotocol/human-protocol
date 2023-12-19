import {
  Grid,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { FC } from 'react';

import { ConnectButton } from '../ConnectButton';
import { STEPS } from './constants';

import keySvg from 'src/assets/key.svg';
import walletSvg from 'src/assets/wallet.svg';

export const MainPage: FC = () => (
  <Grid container>
    <Grid
      item
      xs={12}
      sm={6}
      md={5}
      container
      direction="row"
      justifyContent="flex-start"
      alignItems="center"
    >
      <Grid
        item
        xs={12}
        sm={12}
        md={12}
        container
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
      >
        <img width="100" src={keySvg} alt="lbank" />{' '}
        <div>
          <Typography variant="h4" color="primary">
            Empower HUMAN Scan
          </Typography>
        </div>
        <div>
          <Typography variant="h4" color="primary">
            with ETH KV Store
          </Typography>
        </div>
        <Box sx={{ marginTop: 2 }}>
          <Typography variant="body2" color="primary">
            Store your public key in the blockchain, use your public key to
            encrypt or decrypt data.
          </Typography>
        </Box>
      </Grid>
    </Grid>
    <Grid
      item
      xs={12}
      sm={6}
      md={7}
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
          <Paper
            sx={{
              padding: { md: 2 },
              width: { xl: '46em' },
              marginBottom: 2,
            }}
          >
            {' '}
            <Box sx={{ width: '100%' }}>
              <Stepper sx={{ opacity: 0.2 }} activeStep={-1}>
                {STEPS.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          </Paper>
          <Paper>
            <Grid container direction="column">
              <Grid
                item
                container
                direction="column"
                alignItems="center"
                sx={{
                  marginTop: { xs: 1, sm: 1, md: 10, lg: 10 },
                }}
              >
                {' '}
                <img width="100" src={walletSvg} alt="lbank" />{' '}
                <Typography
                  sx={{ marginTop: 3 }}
                  variant="body2"
                  color="primary"
                >
                  Connect your wallet to continue
                </Typography>
              </Grid>
              <Grid
                item
                container
                direction="row"
                justifyContent="center"
                sx={{
                  marginTop: { xs: 1, sm: 1, lg: 3 },

                  marginBottom: { xs: 1, sm: 1, md: 10, lg: 7 },
                }}
              >
                <ConnectButton />
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Grid>
    </Grid>
  </Grid>
);

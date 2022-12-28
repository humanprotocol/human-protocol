import {
   Grid,
  Paper,
  Typography,
    Box,
    Stepper,
   Step,
   StepLabel
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { ROLES } from 'src/constants';
import useLeaderboardData from 'src/hooks/useLeaderboardData';
import { shortenAddress } from 'src/utils';
import {CustomConnectButton} from './CustomConnectButton'
const steps = [
    'Get Public Key',
    'Add Public Key',
    'Empower Human Scan',
    ];
export const KvstoreView = (): React.ReactElement => {

  return (
          <Grid container >

        <Grid item xs={12} sm={6} md={5} container
            direction="row"
            justifyContent="flex-start"
            alignItems="center"

          >
            <Grid item xs={12} sm={12} md={12} container
                direction="column"
                justifyContent="flex-start"
                alignItems="flex-start"

                >
                <div>
                    <Typography variant="h4" color="primary" >
                        Empower HUMAN Scan
                    </Typography>
                </div>

                <div>
                    <Typography variant="h4" color="primary" >
                        with ETH KV Store
                    </Typography>
                </div>
                <Box sx={{marginTop:2}}>
                    <Typography variant="body2" color="primary" >
                        Use your public key to lorem ipsum
                    </Typography>
                </Box>
            </Grid>


      </Grid>
        <Grid item xs={12} sm={6} md={7}   container
            direction="row"
            justifyContent="center"

           >
            <Grid item xs={12} sm={12} md={12} container
                direction="column"
                justifyContent="center"
                alignItems="center"
                sx={{height:window.innerHeight-340}}
                >
                <Box

                    >

                    <Paper sx={{padding:2,width:"46em",marginBottom:2}}>   <Box sx={{ width: '100%' }}>
                        <Stepper sx={{opacity:0.2}} activeStep={-1}>
                            {steps.map((label) => (
                                    <Step key={label}>
                                        <StepLabel>{label}</StepLabel>
                                    </Step>
                                    ))}
                        </Stepper>
                    </Box></Paper>
                    <Paper>
                        <Grid container direction="column">
                            <Grid item container direction="column"
                                alignItems="flex-start" sx={{marginTop:10,marginLeft:15,marginBottom:10}}>  <img width="100" src="/images/lbank.svg" alt="lbank" /> <Typography sx={{marginTop:3}} variant="body2" color="primary" >
                                Connect your wallet to continue
                            </Typography></Grid>
                            <Grid item container direction="row" justifyContent="flex-end"
                                alignItems="flex-end" sx={{marginTop:10,paddingRight:10,marginBottom:7}}><CustomConnectButton/></Grid>
                        </Grid>
                    </Paper>
                </Box>
            </Grid>
        </Grid>
    </Grid>
  );
};

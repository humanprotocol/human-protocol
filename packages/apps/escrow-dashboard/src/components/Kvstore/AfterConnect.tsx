import {
   Grid,
  Paper,
  Typography,
    Box,
    Stepper,
   Step,
   StepLabel,
    Button
} from '@mui/material';
import React from 'react';

import {CustomConnectButton} from './CustomConnectButton'
const steps = [
    'Get Public Key',
    'Add Public Key',
    'Empower Human Scan',
    ];
export const AfterConnect = (): React.ReactElement => {

  return (
          <Grid container >


        <Grid item xs={12} sm={12} md={12}   container
            direction="row"
            justifyContent="center"

           >
            <Grid item xs={12} sm={12} md={12} container
                direction="column"
                justifyContent="center"
                alignItems="center"
                sx={{height:{lg:window.innerHeight-340,xl:window.innerHeight-340}}}
                >


                <Box

                    >
                    <Typography  variant="h4" sx={{marginBottom:2}} color="primary" >
                        ETH KV Store
                    </Typography>
                    <Paper sx={{padding:{md:2},width:{xl:"46em"},marginBottom:2}}>   <Box sx={{ width: '100%' }}>
                        <Stepper activeStep={0}>
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
                                alignItems="flex-start" sx={{marginTop:{xs:1,sm:1,md:10,lg:10},marginLeft:{xs:1,sm:1,md:15,lg:15},marginBottom:{lg:10}}}>  <img width="100" src="/images/key.png" alt="lbank" /> <Typography sx={{marginTop:3}} variant="body2" color="primary" >
                                If you already have your public key import it, if not generate it
                            </Typography></Grid>
                            <Grid item container direction="row" justifyContent="flex-end"
                                alignItems="flex-end" sx={{marginTop:{xs:1,sm:1,lg:10},paddingRight:{xs:1,sm:1,lg:10},marginBottom:{xs:1,sm:1,lg:7}}}><Button variant="contained" sx={{marginRight:2}} >Generate</Button><Button  variant="outlined">Import</Button></Grid>
                        </Grid>
                    </Paper>
</Box>
            </Grid>
        </Grid>
    </Grid>
  );
};

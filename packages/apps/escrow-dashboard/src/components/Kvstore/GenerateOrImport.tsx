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
export const GenerateOrImport = ()=>{
    return ( <Paper>
        <Grid container direction="column">
            <Grid item container direction="column"
                alignItems="flex-start" sx={{marginTop:{xs:1,sm:1,md:10,lg:10},marginLeft:{xs:1,sm:1,md:15,lg:15},marginBottom:{lg:10}}}>  <img width="100" src="/images/key.png" alt="lbank" /> <Typography sx={{marginTop:3}} variant="body2" color="primary" >
                If you already have your public key import it, if not generate it
            </Typography></Grid>
            <Grid item container direction="row" justifyContent="flex-end"
                alignItems="flex-end" sx={{marginTop:{xs:1,sm:1,lg:10},paddingRight:{xs:1,sm:1,lg:10},marginBottom:{xs:1,sm:1,lg:7}}}><Button variant="contained" sx={{marginRight:2}} >Generate</Button><Button  variant="outlined">Import</Button></Grid>
        </Grid>
    </Paper>)
}
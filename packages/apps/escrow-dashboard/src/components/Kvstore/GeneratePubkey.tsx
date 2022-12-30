import {
    Grid,
    Paper,
    Typography,
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    TextField
} from '@mui/material';
import React from 'react';
export const GeneratePubkey = ()=>{
    return ( <Paper>
        <Grid container direction="column" >
            <Grid item container direction="column"
                alignItems="flex-start"
                justifyContent="center" sx={{paddingLeft:5,paddingTop:5}}>  <Typography sx={{marginTop:3}} variant="body2" color="primary" >
                Fill the fields to generate public key
            </Typography>
                <Grid container sx={{my:{lg:2,xl:2},paddingRight:{xs:1,sm:1,lg:12}}}>
                    <TextField sx={{width:{lg:200,xl:200}}} id="outlined-basic" label="Name" variant="outlined" />
                    <TextField sx={{mx:{lg:2,xl:2},width:{lg:200,xl:200}}} id="Email" label="Email" variant="outlined" />
                    <TextField sx={{width:{lg:200,xl:200}}} id="outlined-basic" label="Passphrase" variant="outlined" />

                </Grid>
            </Grid>

            <Grid item container direction="row" justifyContent="flex-end"
                alignItems="flex-end" sx={{marginTop:{xs:1,sm:1,lg:10},paddingRight:{xs:1,sm:1,lg:10},marginBottom:{xs:1,sm:1,lg:7}}}><Button variant="contained" sx={{marginRight:2}} >Generate Public Key</Button></Grid>
        </Grid>
    </Paper>)
}
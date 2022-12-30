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
export const SuccessGenerate = ()=>{
    return ( <Paper>
        <Grid container direction="column" >
            <Grid item container direction="column"
                alignItems="flex-start"
                justifyContent="center" sx={{paddingLeft:5,paddingTop:5}}>
                <Typography sx={{marginTop:3}} variant="h6" color="primary" >
                    Success!
                </Typography>
                <Typography  variant="body2" color="primary" >
                Your public key has been generated
            </Typography>
                <Grid container  >
                    <Paper  sx={{backgroundColor:"#f6f7fe",width:{lg:600,xl:600},marginRight:{lg:5,xl:5}, height:200,padding:2,marginTop:2,overflowY:"scroll",inlineSize:{xs:300,sm:300,md:400,lg:600,xl:600},overflowWrap:"break-word"}}><Typography align="justify"  variant="body2" color="primary" >
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaassssssssss
                    </Typography></Paper>

                </Grid>
                <Button variant="outlined"  sx={{mt:2}}>Copy</Button>
            </Grid>

            <Grid item container direction="row" justifyContent="flex-end"
                alignItems="flex-end" sx={{marginTop:{xs:1,sm:1,lg:5},paddingRight:{xs:1,sm:1,lg:5},marginBottom:{xs:1,sm:1,lg:7}}}>
                <Button variant="outlined"  sx={{mr:2}}>Download</Button>
                <Button variant="contained"  >Add to ETH - KV Store</Button>

            </Grid>
        </Grid>
    </Paper>)
}
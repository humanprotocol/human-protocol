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
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import React from 'react';
export const ImportPubkey = ()=>{
    return ( <Paper>
        <Grid container direction="column" >
            <Grid item container direction="column"
                alignItems="flex-start"
                justifyContent="center" sx={{paddingLeft:5,paddingTop:5}}>
                <Typography sx={{marginTop:3}} variant="h6" color="primary" >
                    Success!
                </Typography>
                <Typography  variant="body2" color="primary" >
                    Your public key has been uploaded
                </Typography>
                <Typography sx={{marginTop:3}} variant="body2" color="primary" >
                Add your public key file
            </Typography>
                <Grid container sx={{my:{lg:2,xl:2},paddingRight:{xs:1,sm:1,lg:5}}}>
                    <Paper  sx={{backgroundColor:"#f6f7fe",width:{lg:600,xl:600},padding:2,marginTop:2}}>
                        <Grid container justifyContent="center">
                            <Button variant="outlined" startIcon={<UploadFileIcon />} >Select or drop file</Button>
                        </Grid>
                       </Paper>

                </Grid>
                <Grid container sx={{my:{lg:2,xl:2},paddingRight:{xs:1,sm:1,lg:5}}}>
                    <Paper  sx={{backgroundColor:"#f6f7fe",width:{lg:600,xl:600},padding:2,marginTop:2}}>
                        <Grid container justifyContent="center">
                            <Grid item container justifyContent="center" lg={11} xl={11}>
                                <Typography  variant="body2" color="primary" >
                                    Add
                                </Typography>
                            </Grid>
                            <Grid item container justifyContent="flex-end" lg={1} xl={1}>
                                <CloseIcon/>
                            </Grid>
                        </Grid>
                    </Paper>

                </Grid>
                <Grid container sx={{my:{lg:2,xl:2},paddingRight:{xs:1,sm:1,lg:5}}}>
                    <Paper  sx={{backgroundColor:"#f6f7fe",width:{lg:600,xl:600},padding:2,marginTop:2}}>
                        <Grid container justifyContent="center">
                            <Grid item container justifyContent="center" lg={11} xl={11}>
                                <Typography  variant="body2" color="primary" >
                                    Add
                                </Typography>
                            </Grid>
                            <Grid item container justifyContent="flex-end" lg={1} xl={1}>
                                <CheckCircleIcon/>
                            </Grid>
                        </Grid>
                    </Paper>

                </Grid>
            </Grid>

            <Grid item container direction="row" justifyContent="flex-end"
                alignItems="flex-end" sx={{marginTop:{xs:1,sm:1,lg:10},paddingRight:{xs:1,sm:1,lg:5},marginBottom:{xs:1,sm:1,lg:7}}}>
                <Button variant="outlined" sx={{marginRight:2}} >Back</Button>
                <Button variant="contained" sx={{marginRight:2}} >Import Public Key</Button>
                <Button variant="contained"  >Add to ETH - KV Store</Button>

            </Grid>
        </Grid>
    </Paper>)
}
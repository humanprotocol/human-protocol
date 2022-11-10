import React from 'react';
import Stack from '@mui/material/Stack';


import Grid from '@mui/material/Grid';



export default function PleaseConnect() {

  return (
    <Stack spacing={2} direction="column" justifyContent="center" marginTop={3} >
    
      <Grid container justifyContent="center" >
      Please connect your wallet in order to use this app
      </Grid>
      
    </Stack>
  );
}

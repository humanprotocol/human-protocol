import {
  Grid,
  Paper,
  Typography,
  Button,
} from '@mui/material';
import React, { Dispatch } from 'react';
export const GenerateOrImport = ({
  setStep,setPage
}: {
  setStep: Dispatch<number>;
  setPage: Dispatch<number>;
}) => {
  return (
    <Paper>
        <Grid container justifyContent="center" direction="column">
        <Grid
          item
          container
          direction="column"
          alignItems="center"
          sx={{
            marginTop: { xs: 1, sm: 1, md: 10, lg: 10 },
             marginBottom: { lg: 10 },
          }}
        >
          {' '}
          <img width="100" src="/images/key.svg" alt="lbank" />{' '}
          <Typography sx={{ marginTop: 3 }} variant="body2" color="primary">
            If you already have your public key import it, if not generate it
          </Typography>
        </Grid>
        <Grid
          item
          container
          direction="row"
          justifyContent="center"
          alignItems="flex-end"
          sx={{
            marginTop: { xs: 1, sm: 1, md: 10, lg: 10 },

              marginBottom: { xs: 1, sm: 1,md: 10, lg: 7 },
          }}
        >
          <Button
              onClick={() => {setStep(1);setPage(1);}}
            variant="contained"
            sx={{ marginRight: 2 }}
          >
            Generate
          </Button>
            <Button onClick={() => {setStep(1);setPage(2);}} variant="outlined">
            Import
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

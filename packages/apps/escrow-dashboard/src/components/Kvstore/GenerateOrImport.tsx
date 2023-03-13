import { Grid, Paper, Typography, Button } from '@mui/material';
import { Dispatch, FC } from 'react';

import keySvg from 'src/assets/key.svg';

export type GenerateOrImportProps = {
  setStep: Dispatch<number>;
  setPage: Dispatch<number>;
};

export const GenerateOrImport: FC<GenerateOrImportProps> = ({
  setStep,
  setPage,
}) => (
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
        <img width="100" src={keySvg} alt="lbank" />{' '}
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

          marginBottom: { xs: 1, sm: 1, md: 10, lg: 7 },
        }}
      >
        <Button
          onClick={() => {
            setStep(1);
            setPage(1);
          }}
          variant="contained"
          sx={{ marginRight: 2 }}
        >
          Generate
        </Button>
        <Button
          onClick={() => {
            setStep(1);
            setPage(2);
          }}
          variant="outlined"
        >
          Import
        </Button>
      </Grid>
    </Grid>
  </Paper>
);

import { NetworkData } from '@human-protocol/sdk';
import { Button, Grid, Paper, Typography } from '@mui/material';
import { FC } from 'react';
import { Link } from 'react-router-dom';

export type SuccessProps = {
  txHash: string;
  network: NetworkData;
};

export const Success: FC<SuccessProps> = ({ txHash, network }) => {
  return (
    <Paper>
      <Grid
        container
        direction="column"
        sx={{
          padding: { xs: 2, sm: 2, md: 10, lg: 10 },
          minWidth: 600,
        }}
        justifyContent="center"
      >
        <Grid item container direction="row" justifyContent="center">
          <h2>&#x2713;</h2>
        </Grid>
        <Grid
          item
          container
          direction="row"
          alignItems="center"
          sx={{ marginTop: { xs: 1, sm: 1, md: 5, lg: 5 } }}
        >
          <Typography
            variant="h6"
            color="primary"
            align="center"
            width={'100%'}
          >
            Request Complete!
          </Typography>
        </Grid>

        <Grid
          item
          container
          direction="row"
          alignItems="center"
          sx={{ marginTop: { xs: 1, sm: 1, md: 3, lg: 3 } }}
        >
          <Typography
            variant="body2"
            color="primary"
            align="center"
            width={'100%'}
          >
            Congratulations, 10 testnet HMT was sent to your account
          </Typography>
        </Grid>

        <Grid item container direction="row" alignItems="center" sx={{ pb: 3 }}>
          <Paper
            sx={{
              backgroundColor: '#FAFAFA',
              padding: 2,
              marginTop: 2,
              overflowY: 'scroll',
              overflowWrap: 'break-word',
            }}
          >
            <Typography align="justify" variant="body2" color="primary">
              <Link
                to={network?.scanUrl + '/tx/' + txHash}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {txHash}
              </Link>
            </Typography>
          </Paper>
        </Grid>
        <Button
          size="medium"
          variant="contained"
          sx={{ marginTop: { xs: 1, sm: 1, md: 3, lg: 3 } }}
          onClick={() => {
            window.location.href = '/';
          }}
        >
          Home
        </Button>
      </Grid>
    </Paper>
  );
};

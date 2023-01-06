import * as React from 'react';
import { Grid, Box } from '@mui/material';
import { useSelector } from 'react-redux';
import logImg from '../../assets/images/logo.svg';
import { makeIsTokenAuthenticated } from '../../services/redux/selectors/auth';
import { EscrowDashboard } from '../../components/EscrowDashboard/EscrowDashboard';

export const Home = () => {
  const isAuth = useSelector(makeIsTokenAuthenticated);

  return (
    <>
      {isAuth ? (
        <EscrowDashboard />
      ) : (
        <Box style={{ marginTop: '150px' }}>
          <Grid container justifyContent="center">
            <Box sx={{ width: '400px' }}>
              <img
                className="app-logo mr-3"
                src={logImg}
                alt="human-app-logo"
              />
            </Box>
          </Grid>
        </Box>
      )}
    </>
  );
};

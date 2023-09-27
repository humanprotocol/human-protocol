import { Box, Grid, Typography } from '@mui/material';
import React from 'react';
import { Outlet } from 'react-router-dom';
import bagImg from '../assets/bag.png';
import humanImg from '../assets/human.png';
import userImg from '../assets/user.png';
import { DefaultHeader } from '../components/Headers/DefaultHeader';

export default function DefaultLayout() {
  return (
    <Box>
      <DefaultHeader />
      <Box
        sx={{
          px: { sm: 4, md: 8, xl: 30 },
          py: { xs: 12, sm: 16, xl: 27 },
        }}
      >
        <Grid container>
          <Grid item xs={12} sm={12} md={6}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItmes: 'center', ml: -4 }}>
                <img src={bagImg} alt="bag" />
                <img src={userImg} alt="user" />
                <img src={humanImg} alt="human" />
              </Box>
              <Typography
                color="primary"
                sx={{ fontWeight: 400, fontSize: '80px', lineHeight: '80px' }}
              >
                <b>HUMAN</b>
                <br /> Job Launcher
              </Typography>
              <Typography color="primary" variant="h5" fontWeight={400} my={3}>
                Launch Jobs on the HUMAN App.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={12} md={6}>
            <Outlet />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

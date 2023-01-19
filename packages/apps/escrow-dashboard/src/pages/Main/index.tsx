import * as React from 'react';
import { Box, Grid } from '@mui/material';

import { Escrow, Token, Leaderboard, SolvedTasks, News } from 'src/components';

export const Main: React.FC = (): React.ReactElement => {
  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 } }}>
      <Box
        sx={{
          background: '#f6f7fe',
          borderRadius: {
            xs: '16px',
            sm: '16px',
            md: '24px',
            lg: '32px',
            xl: '40px',
          },
          padding: {
            xs: '24px 16px',
            md: '42px 54px',
            lg: '56px 72px',
            xl: '70px 90px',
          },
        }}
      >
        <Grid container spacing={4}>
          <Grid item xs={12} lg={6}>
            <SolvedTasks />
          </Grid>
          <Grid item xs={12} lg={6}>
            <News />
          </Grid>
        </Grid>
        <Escrow />
        <Token />
        <Leaderboard showAll={false} />
      </Box>
    </Box>
  );
};

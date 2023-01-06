import * as React from 'react';

import { Grid, Box, Typography } from '@mui/material';
import { BoxShadowContainer } from '../../../../components/Grid';

export const Stats: React.FC<{}> = () => {
  return (
    <BoxShadowContainer>
      <Grid
        container
        sx={{
          boxShadow: { sm: '0 0 5px #ddd' },
          py: '6rem',
          px: '1rem',
        }}
      >
        <Box sx={{ margin: '0 auto' }}>
          <Typography
            sx={{
              textAlign: 'center',
              pb: { sm: '3rem' },
              color: '#616161',
            }}
          >
            Job Successfully created
          </Typography>
        </Box>
      </Grid>
    </BoxShadowContainer>
  );
};

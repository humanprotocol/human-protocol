import * as React from 'react';

import { Grid, Box, Typography } from '@mui/material';
import { GiConfirmed } from 'react-icons/gi';
import { BoxShadowContainer } from '../../../../components/Grid';

export const ConfirmStep: React.FC<{}> = () => {
  return (
    <BoxShadowContainer>
      <Grid container>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            margin: '0 auto',
          }}
        >
          <Typography
            sx={{
              textAlign: 'center',
              color: '#616161',
              mr: '10px',
            }}
          >
            Job successfully created!
          </Typography>
          <GiConfirmed />
        </Box>
      </Grid>
    </BoxShadowContainer>
  );
};

import * as React from 'react';
import { Box, Button, Typography } from '@mui/material';

import ViewTitle from 'src/components/ViewTitle';
import { CardContainer } from 'src/components/Cards/Container';

export const SolvedTasksContainer: React.FC<{}> = (): React.ReactElement => {
  return (
    <Box
      id="solved-tasks-container"
      sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <Box display="flex" alignItems="center" flexWrap="wrap">
        <ViewTitle title="Solved Tasks" iconUrl="/images/user.svg" />
      </Box>
      <Box mt={{ xs: 4, md: 8 }} flex={1}>
        <CardContainer>
          <Typography variant="body2" color="primary" fontWeight={600} mb="4px">
            Solved tasks till November 31 2022
          </Typography>
          <Typography
            variant="h2"
            color="primary"
            fontWeight={600}
            sx={{ fontSize: { xs: 32, md: 48, lg: 64, xl: 80 } }}
          >
            114,000,000
          </Typography>
        </CardContainer>
      </Box>
    </Box>
  );
};

export default SolvedTasksContainer;

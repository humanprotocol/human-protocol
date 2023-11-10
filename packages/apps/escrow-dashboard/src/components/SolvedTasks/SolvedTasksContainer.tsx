import { Box, Grid } from '@mui/material';
import { FC } from 'react';

import { ViewTitle } from '../ViewTitle';
import { NewsView } from './NewsView';
import { SolvedTasksView } from './SolvedTasksView';
import tasksSvg from 'src/assets/tasks.svg';

export const SolvedTasksContainer: FC = () => {
  return (
    <Box id="solved-tasks-container">
      <Box display="flex" alignItems="center" flexWrap="wrap">
        <ViewTitle title="Solved Tasks" iconUrl={tasksSvg} />
      </Box>
      <Box mt={{ xs: '26px', md: '51px' }}>
        <Grid container spacing={{ xs: 5, lg: 3, xl: 4 }}>
          <Grid item xs={12} md={8}>
            <SolvedTasksView />
          </Grid>
          <Grid item xs={12} md={4}>
            <NewsView />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

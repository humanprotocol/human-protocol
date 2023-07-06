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
      <Box mt={{ xs: 4, md: 8 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6} lg={8}>
            <SolvedTasksView />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <NewsView />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

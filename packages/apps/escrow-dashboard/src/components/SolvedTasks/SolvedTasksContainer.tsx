import { Box, Grid, Typography } from '@mui/material';
import { FC } from 'react';

import { ViewTitle } from '../ViewTitle';
import { NewsView } from './NewsView';
import { SolvedTasksView } from './SolvedTasksView';
import newsSvg from 'src/assets/news.svg';
import tasksSvg from 'src/assets/tasks.svg';

export const SolvedTasksContainer: FC = () => {
  return (
    <Box id="solved-tasks-container">
      <Box display="flex" alignItems="center" flexWrap="wrap">
        <ViewTitle title="Solved Tasks" iconUrl={tasksSvg} />
        <Typography
          color="text.secondary"
          fontSize={14}
          sx={{ mt: 1.5, ml: 2 }}
        ></Typography>
      </Box>
      <Box mt={{ xs: 4, md: 8 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6} lg={8}>
            <SolvedTasksView />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <NewsView
              title="HUMAN APP: Task limits"
              content="Part of the Protocol's growth being implemented in the interests of the community as a whole."
              image={newsSvg}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

import { Box, Typography } from '@mui/material';
import * as React from 'react';

import tasksSvg from 'src/assets/tasks.svg';
import ViewTitle from 'src/components/ViewTitle';

export const SolvedTasksContainer: React.FC<{}> = (): React.ReactElement => {
  return (
    <Box
      id="solved-tasks-container"
      sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <Box display="flex" alignItems="center" flexWrap="wrap">
        <ViewTitle title="Solved Tasks" iconUrl={tasksSvg} />
        <Typography
          color="text.secondary"
          fontSize={14}
          sx={{ mt: 1.5, ml: 2 }}
        >
          till December 31, 2022
        </Typography>
      </Box>
      <Typography
        variant="h2"
        color="primary"
        fontWeight={600}
        sx={{ fontSize: { xs: 32, md: 48, lg: 64, xl: 80 }, pl: 14 }}
        lineHeight={1}
      >
        247,392,072
      </Typography>
    </Box>
  );
};

export default SolvedTasksContainer;

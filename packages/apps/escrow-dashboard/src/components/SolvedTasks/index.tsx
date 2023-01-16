import { Box, Typography } from '@mui/material';
import numeral from 'numeral';
import * as React from 'react';

import tasksSvg from 'src/assets/tasks.svg';
import ViewTitle from 'src/components/ViewTitle';

const SOLVED_TASKS = [
  { date: '2022-07', value: 2181348 },
  { date: '2022-08', value: 2537442 },
  { date: '2022-09', value: 7014852 },
  { date: '2022-10', value: 17189000 },
  { date: '2022-11', value: 97000578 },
  { date: '2022-12', value: 247392072 },
];

export const SolvedTasksContainer: React.FC<{}> = (): React.ReactElement => {
  const solvedTasksCount = SOLVED_TASKS.reduce((acc, d) => acc + d.value, 0);

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
        {numeral(solvedTasksCount).format('0,0')}
      </Typography>
    </Box>
  );
};

export default SolvedTasksContainer;

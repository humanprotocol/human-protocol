import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import numeral from 'numeral';
import { FC } from 'react';

import { ViewTitle } from '../ViewTitle';

import tasksSvg from 'src/assets/tasks.svg';

const SOLVED_TASKS = [
  { date: '2022-07-31', value: 2181348 },
  { date: '2022-08-31', value: 2537442 },
  { date: '2022-09-30', value: 7014852 },
  { date: '2022-10-31', value: 17189000 },
  { date: '2022-11-30', value: 97000578 },
  { date: '2022-12-31', value: 247392072 },
  { date: '2023-01-31', value: 209000000 },
];

export const SolvedTasksContainer: FC = () => {
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
          till{' '}
          {dayjs(SOLVED_TASKS[SOLVED_TASKS.length - 1].date).format(
            'MMM D, YYYY'
          )}
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

import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import numeral from 'numeral';
import { FC } from 'react';

import SOLVED_TASKS from '../../history-data/solved_tasks.json';
import { CardContainer } from '../Cards';
import { TooltipIcon } from '../TooltipIcon';
import { TOOLTIPS } from 'src/constants/tooltips';

export const SolvedTasksView: FC = () => {
  const solvedTasksCount = SOLVED_TASKS.reduce((acc, d) => acc + d.value, 0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <CardContainer
      sxProps={{ padding: { xs: '32px 32px 44px', md: '44px 54px 72px' } }}
    >
      <Box mb={2}>
        <Typography variant="body2" color="primary" fontWeight={600} mb="14px">
          {`Total number of tasks till ${dayjs(
            SOLVED_TASKS[SOLVED_TASKS.length - 1].date
          ).format('MMM D, YYYY')}`}
        </Typography>
        <Typography
          variant="h2"
          color="primary"
          fontWeight={800}
          lineHeight={1.125}
          sx={{ whiteSpace: 'nowrap' }}
          fontSize={{ xs: '40px', lg: '55px' }}
        >
          {numeral(solvedTasksCount).format('0.00 a').toUpperCase()}
        </Typography>
      </Box>
      <TooltipIcon
        position={isMobile ? 'topRight' : 'bottomLeft'}
        title={TOOLTIPS.SOLVED_TASKS}
      />
    </CardContainer>
  );
};

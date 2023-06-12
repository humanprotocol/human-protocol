import { Box, Typography } from '@mui/material';
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
        <Box
          sx={{
            display: 'flex',
            gap: 4,
            flexDirection: { xs: 'column', lg: 'row' },
          }}
        >
          <Box
            sx={{
              minWidth: { xs: 'auto', xl: '960px' },
            }}
          >
            <SolvedTasksView />
          </Box>
          <Box sx={{ flex: 1 }}>
            <NewsView
              title="Commonwealth voting: 1 HMT (ERC-20) required"
              content="The HUMAN Protocol Commonwealth forum is the center of all things related to community governance."
              image={newsSvg}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

import { Box, Chip, Typography } from '@mui/material';
import { FC } from 'react';

import { JobTypesView } from './JobTypesView';

export const LeaderboardAllJobTypesContainer: FC = () => {
  return (
    <Box>
      <Box display="flex" justifyContent="center" alignItems="start" mb={13}>
        <Typography fontWeight={800} variant="h2" color="primary">
          Leaderboard
        </Typography>
        <Chip label="NEW" sx={{ m: '10px' }} />
      </Box>
      <JobTypesView />
    </Box>
  );
};

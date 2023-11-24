import { Box, Chip, Typography } from '@mui/material';
import { FC } from 'react';

import { JobTypesView } from './JobTypesView';

export const LeaderboardAllJobTypesContainer: FC = () => {
  return (
    <Box>
      <Box display="flex" justifyContent="center" alignItems="start">
        <Typography fontWeight={800} variant="h2" color="primary">
          Launchpad
        </Typography>
        <Chip
          label="NEW"
          sx={{ m: '10px' }}
          variant="outlined"
          color="primary"
        />
      </Box>
      <JobTypesView />
    </Box>
  );
};

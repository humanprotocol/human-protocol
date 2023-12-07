import { Box, Chip, Typography } from '@mui/material';

import { LaunchJobView } from './LaunchJobView';
import { LeaderboardView } from './LeaderboardView';
import { OraclesView } from './OraclesView';

export const Launchpad = () => {
  return (
    <Box>
      <Box display="flex" justifyContent="center" alignItems="start">
        <Box>
          <Typography
            fontWeight={800}
            variant="h2"
            color="primary"
            textAlign="center"
          >
            Launchpad
          </Typography>
          <Typography variant="h6" color="primary" textAlign="center">
            All HUMAN activity. In one place.
          </Typography>
        </Box>
        <Chip
          label="NEW"
          sx={{ m: '10px' }}
          variant="outlined"
          color="primary"
        />
      </Box>
      <LaunchJobView />
      <LeaderboardView />
      <OraclesView />
    </Box>
  );
};

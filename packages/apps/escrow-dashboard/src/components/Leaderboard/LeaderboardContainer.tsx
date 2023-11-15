import { Box, Chip, Typography } from '@mui/material';
import { FC } from 'react';

import { LaunchJobView } from './LaunchJobView';
import { LeaderboardView } from './LeaderboardView';
import { OraclesView } from './OraclesView';

type LeaderboardContainerProps = {
  showAll?: boolean;
};

export const LeaderboardContainer: FC<LeaderboardContainerProps> = ({
  showAll = true,
}) => {
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
        <Chip label="NEW" sx={{ m: '10px' }} />
      </Box>
      <LaunchJobView />
      <LeaderboardView showAll={showAll} />
      <OraclesView />
    </Box>
  );
};

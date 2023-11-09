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
      <Box display="flex" justifyContent="center" alignItems="start" mb={13}>
        <Typography fontWeight={800} variant="h2" color="primary">
          Leaderboard
        </Typography>
        <Chip label="NEW" sx={{ m: '10px' }} />
      </Box>
      <LaunchJobView />
      <LeaderboardView showAll={showAll} />
      <OraclesView />
    </Box>
  );
};

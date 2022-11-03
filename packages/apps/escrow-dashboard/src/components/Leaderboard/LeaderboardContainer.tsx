import * as React from 'react';
import { Box } from '@mui/material';

import ViewTitle from 'src/components/ViewTitle';

import { LeaderboardView } from './LeaderboardView';

interface ILeaderboardContainer {}

export const LeaderboardContainer: React.FC<
  ILeaderboardContainer
> = (): React.ReactElement => {
  return (
    <Box>
      <ViewTitle title="Leaderboard" iconUrl="/images/user.svg" />
      <Box mt={{ xs: 4, md: 8 }}>
        <LeaderboardView />
      </Box>
    </Box>
  );
};

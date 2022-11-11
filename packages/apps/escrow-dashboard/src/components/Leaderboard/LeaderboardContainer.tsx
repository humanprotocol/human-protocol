import * as React from 'react';
import { Box, Button } from '@mui/material';

import ViewTitle from 'src/components/ViewTitle';

import { LeaderboardView } from './LeaderboardView';

interface ILeaderboardContainer {
  showAll?: boolean;
}

export const LeaderboardContainer: React.FC<ILeaderboardContainer> = ({
  showAll = true,
}): React.ReactElement => {
  return (
    <Box mt={{ xs: 4, md: 8 }} id="leaderboard">
      <Box display="flex" alignItems="center" flexWrap="wrap">
        <ViewTitle title="Leaderboard" iconUrl="/images/user.svg" />
        {!showAll && (
          <Button
            variant="outlined"
            sx={{ ml: { xs: 'auto', sm: 3 }, mr: { xs: 'auto', sm: 0 } }}
            href="/leaderboard"
          >
            See More
          </Button>
        )}
      </Box>
      <Box mt={{ xs: 4, md: 8 }}>
        <LeaderboardView showAll={showAll} />
      </Box>
    </Box>
  );
};

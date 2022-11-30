import * as React from 'react';
import {
  Box,
  Button,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import userSvg from 'src/assets/user.svg';
import { ViewTitle } from 'src/components';

import { LeaderboardView } from './LeaderboardView';
import FilterListFilledIcon from '../Icons/FilterListFilled';
import { useState } from 'react';

interface ILeaderboardContainer {
  showAll?: boolean;
}

export const LeaderboardContainer: React.FC<ILeaderboardContainer> = ({
  showAll = true,
}): React.ReactElement => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const openMobileFilter = () => setMobileFilterOpen(true);

  const closeMobileFilter = () => setMobileFilterOpen(false);

  return (
    <Box mt={{ xs: 4, md: 8 }} id="leaderboard">
      <Box display="flex" alignItems="center" flexWrap="wrap">
        <ViewTitle title="Leaderboard" iconUrl={userSvg} />
        {!showAll && (
          <Button
            variant="outlined"
            sx={{ ml: { xs: 'auto', sm: 3 }, mr: { xs: 'auto', sm: 0 } }}
            href="/leaderboard"
          >
            See More
          </Button>
        )}
        {showAll && isMobile && (
          <IconButton sx={{ ml: 'auto' }} onClick={openMobileFilter}>
            <FilterListFilledIcon />
          </IconButton>
        )}
      </Box>
      <Box mt={{ xs: 4, md: 8 }}>
        <LeaderboardView
          showAll={showAll}
          filterOpen={mobileFilterOpen}
          openFilter={openMobileFilter}
          closeFilter={closeMobileFilter}
        />
      </Box>
    </Box>
  );
};

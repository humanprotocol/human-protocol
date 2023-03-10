import * as React from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import userSvg from 'src/assets/user.svg';
import { ViewTitle } from 'src/components/ViewTitle';

import { LeaderboardView } from './LeaderboardView';
import FilterListFilledIcon from '../Icons/FilterListFilled';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from 'src/state';
import { useLeadersData } from 'src/state/leader/hooks';

interface ILeaderboardContainer {
  showAll?: boolean;
}

export const LeaderboardContainer: React.FC<ILeaderboardContainer> = ({
  showAll = true,
}): React.ReactElement => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const { leadersLoaded } = useSelector((state: AppState) => state.leader);

  useLeadersData();

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
        {leadersLoaded ? (
          <LeaderboardView
            showAll={showAll}
            filterOpen={mobileFilterOpen}
            openFilter={openMobileFilter}
            closeFilter={closeMobileFilter}
          />
        ) : (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress size={36} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

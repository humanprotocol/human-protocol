import { Box, Chip, Typography } from '@mui/material';
import { FC } from 'react';

import { LaunchTaskView } from './LaunchTaskView';
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
      <Box display="flex" justifyContent="center" alignItems="start" mb={3}>
        <Typography fontWeight={800} variant="h2" color="primary">
          Leaderboard
        </Typography>
        <Chip label="NEW" sx={{ m: '10px' }} />
      </Box>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap="108px"
      >
        <Box>
          <Typography
            fontSize="20px"
            fontWeight={500}
            lineHeight={1.6}
            color="primary"
            mb={2}
          >
            Launch task
          </Typography>
          <Typography
            fontSize="20px"
            fontWeight={500}
            lineHeight={1.6}
            color="text.secondary"
          >
            Data annotation tasks
          </Typography>
        </Box>
        <Box>
          <Typography
            fontSize="20px"
            fontWeight={500}
            lineHeight={1.6}
            color="text.secondary"
            mb={2}
          >
            Explore
          </Typography>
          <Typography
            fontSize="20px"
            fontWeight={500}
            lineHeight={1.6}
            color="text.secondary"
          >
            Leaderboard
          </Typography>
        </Box>
        <Box>
          <Typography
            fontSize="20px"
            fontWeight={500}
            lineHeight={1.6}
            color="text.secondary"
            mb={2}
          >
            Learn
          </Typography>
          <Typography
            fontSize="20px"
            fontWeight={500}
            lineHeight={1.6}
            color="text.secondary"
          >
            Oracles
          </Typography>
        </Box>
      </Box>
      <LaunchTaskView />
      <LeaderboardView showAll={showAll} />
      <OraclesView />
    </Box>
  );
};

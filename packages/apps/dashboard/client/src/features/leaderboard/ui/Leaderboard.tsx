import { FC } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

import useLeaderboardDetails from '../api/useLeaderboardDetails';
import useLeaderboardFiltersStore from '../store/useLeaderboardFiltersStore';

import DataGridWrapper from './DataGridWrapper';
import SelectNetwork from './SelectNetwork';

type Props = {
  viewAllBanner?: boolean;
  first?: number;
};

const Leaderboard: FC<Props> = ({ viewAllBanner, first }) => {
  const navigate = useNavigate();
  const { chainId } = useLeaderboardFiltersStore();
  const { data, status, error } = useLeaderboardDetails(chainId, first);

  return (
    <Box
      px={{ xs: 2, md: 4 }}
      py={4}
      mt={3}
      borderRadius="16px"
      bgcolor="white.main"
    >
      <Box
        display={{ xs: 'block', md: 'none' }}
        padding="10px"
        mb={2.5}
        width="270px"
        bgcolor="white.light"
      >
        <SelectNetwork />
      </Box>
      <DataGridWrapper data={data} status={status} error={error} />
      {viewAllBanner ? (
        <Button
          size="large"
          variant="outlined"
          fullWidth
          sx={{
            borderColor: 'primary.main',
          }}
          onClick={() => navigate('/leaderboard')}
        >
          View All
        </Button>
      ) : null}
    </Box>
  );
};

export default Leaderboard;

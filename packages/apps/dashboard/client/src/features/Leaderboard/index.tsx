import { FC } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';

import { LeaderBoardData } from '@/services/api/use-leaderboard-details';

import { DataGridWrapper } from './components/DataGridWrapper';
import { SelectNetwork } from './components/SelectNetwork';

type Props = {
  data: LeaderBoardData | undefined;
  status: 'success' | 'error' | 'pending';
  error: unknown;
  viewAllBanner?: boolean;
};

export const Leaderboard: FC<Props> = ({
  data,
  status,
  error,
  viewAllBanner,
}) => {
  const navigate = useNavigate();
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
          sx={{
            height: '42px',
            border: '1px solid',
            borderColor: 'primary.main',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          fullWidth
          onClick={() => {
            navigate('/leaderboard');
          }}
        >
          <Typography variant="Button Large">View All</Typography>
        </Button>
      ) : null}
    </Box>
  );
};

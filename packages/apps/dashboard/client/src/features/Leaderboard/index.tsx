import { FC } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import { useNavigate } from 'react-router-dom';
import SimpleBar from 'simplebar-react';

import { SelectNetwork } from './components/SelectNetwork';
import { DataGridWrapper } from './components/DataGridWrapper';
import { LeaderBoardData } from '@services/api/use-leaderboard-details';
import { colorPalette } from '@assets/styles/color-palette';

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
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        px: { xs: 2, md: 4 },
        py: 4,
        mt: 3,
        borderRadius: '16px',
      }}
    >
      <Box
        display={{ xs: 'block', md: 'none' }}
        padding="10px"
        mb={2.5}
        width="270px"
        bgcolor={colorPalette.whiteSolid}
      >
        <SelectNetwork />
      </Box>
      <SimpleBar>
        <DataGridWrapper data={data} status={status} error={error} />
      </SimpleBar>
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
    </TableContainer>
  );
};

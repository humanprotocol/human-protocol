import { FC } from 'react';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import styled from '@mui/material/styles/styled';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Link } from 'react-router-dom';

import CustomTooltip from '@/components/CustomTooltip';
import GraphSwiper from '@/components/Home/GraphSwiper';
import { LeaderboardIcon } from '@/components/Icons/LeaderboardIcon';
import PageWrapper from '@/components/PageWrapper';
import SearchBar from '@/components/SearchBar/SearchBar';
import ShadowIcon from '@/components/ShadowIcon';
import HMTPrice from '@/pages/Home/HMTPrice';
import Holders from '@/pages/Home/Holders';
import TotalNumberOfTasks from '@/pages/Home/TotalNumberOfTasks';
import TotalTransactions from '@/pages/Home/TotalTransactions';
import { useIsMobile } from '@/utils/hooks/use-breakpoints';

import { Leaderboard } from './Leaderboard';

const CardWrapper = styled(Grid)(({ theme }) => ({
  display: 'flex',
  background: theme.palette.white.main,
  borderRadius: '16px',
  padding: '24px 32px',
  [theme.breakpoints.up('md')]: {
    height: 300,
  },
  [theme.breakpoints.down('md')]: {
    height: 'auto',
  },
}));

const InfoTooltip = ({ title }: { title: string }) => (
  <CustomTooltip title={title} arrow>
    <HelpOutlineIcon sx={{ color: 'text.secondary' }} />
  </CustomTooltip>
);

const renderViewChartsButton = (show: boolean) => {
  if (show) {
    return (
      <Button
        variant="outlined"
        color="secondary"
        component={Link}
        to="/graph"
        sx={{
          padding: '4px 10px',
        }}
      >
        View Charts
      </Button>
    );
  } else {
    return null;
  }
};

const Home: FC = () => {
  const isMobile = useIsMobile();

  return (
    <PageWrapper violetHeader>
      <Typography variant={isMobile ? 'H6-Mobile' : 'h3'} color="white.main">
        All HUMAN activity. In one place.
      </Typography>
      <SearchBar className="home-page-search" />
      <Grid container mt={{ xs: 6, md: 8 }} columnSpacing={3} rowSpacing={3}>
        <Grid xs={12} md={3}>
          <CardWrapper flexDirection="column" gap={3}>
            <Typography variant="body2">Token</Typography>
            <Box display="flex" gap={1}>
              <InfoTooltip title="Token Current Price" />
              <HMTPrice />
            </Box>
            <Divider />
            <Box display="flex" gap={1}>
              <InfoTooltip title="Number of users holding HMT" />
              <Holders />
            </Box>
          </CardWrapper>
        </Grid>
        <Grid xs={12} md={9}>
          <CardWrapper gap={4} flexDirection={{ xs: 'column', md: 'row' }}>
            <Box
              display="flex"
              flexDirection="column"
              gap={3}
              width={{ xs: 'unset', md: '45%' }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="body2">
                  Data Overview (All networks)
                </Typography>
                {renderViewChartsButton(!isMobile)}
              </Box>
              <Box display="flex" gap={1}>
                <InfoTooltip title="Total number of transactions" />
                <TotalTransactions />
              </Box>
              <Divider />
              <Box display="flex" gap={1}>
                <InfoTooltip title="Number of tasks that have been launched" />
                <TotalNumberOfTasks />
              </Box>
              <Divider sx={{ display: { xs: 'block', md: 'none' } }} />
            </Box>
            <Box width={{ xs: 'unset', md: '55%' }} mx={{ xs: -4, md: 0 }}>
              <GraphSwiper />
            </Box>
            {renderViewChartsButton(isMobile)}
          </CardWrapper>
        </Grid>
      </Grid>
      <ShadowIcon
        className="home-page-leaderboard"
        title="Leaderboard"
        img={<LeaderboardIcon />}
      />
      <Leaderboard />
    </PageWrapper>
  );
};

export default Home;

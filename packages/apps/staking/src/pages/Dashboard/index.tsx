import { Box, Container, Grid, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';
import { KVStoreIcon } from '../../assets/KVStoreIcon';
import BalanceCard from '../../components/BalanceCard';
import LockedAmountCard from '../../components/LockedAmountCard';
import StakeModal from '../../components/modals/StakeModal';
import UnstakeModal from '../../components/modals/UnstakeModal';
import NetworkStatus from '../../components/NetworkStatus';
import PageWrapper from '../../components/PageWrapper';
import ShadowIcon from '../../components/ShadowIcon';
import StakedAmountCard from '../../components/StakedAmountCard';
import KVStoreTable from '../../components/Tables/kvstore';
import WithdrawableAmountCard from '../../components/WithdrawableAmountCard';

const Dashboard: React.FC = () => {
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [unstakeModalOpen, setUnstakeModalOpen] = useState(false);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <PageWrapper violetHeader>
      <Box>
        <Container maxWidth={false}>
          <Box
            sx={{
              mt: 6,
              mb: 8,
              display: 'flex',
              flexDirection: isSmallScreen ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isSmallScreen ? 'flex-start' : 'center',
              gap: 2,
            }}
          >
            <Typography
              variant="h1"
              fontWeight="bold"
              color={theme.palette.white.main}
            >
              Staking Overview
            </Typography>
            <NetworkStatus />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <BalanceCard />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StakedAmountCard
                onStakeOpen={() => setStakeModalOpen(true)}
                onUnstakeOpen={() => setUnstakeModalOpen(true)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <LockedAmountCard />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <WithdrawableAmountCard />
            </Grid>
          </Grid>

          <Box mt={8}>
            <ShadowIcon
              className="home-page-kvstore"
              title="KV Store"
              img={<KVStoreIcon />}
            />
            <KVStoreTable />
          </Box>
        </Container>
      </Box>

      <StakeModal
        open={stakeModalOpen}
        onClose={() => setStakeModalOpen(false)}
      />
      <UnstakeModal
        open={unstakeModalOpen}
        onClose={() => setUnstakeModalOpen(false)}
      />
    </PageWrapper>
  );
};

export default Dashboard;

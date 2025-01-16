import React, { useState } from 'react';
import { Box, Grid, Container, Typography } from '@mui/material';
import BalanceCard from '../../components/BalanceCard';
import StakedAmountCard from '../../components/StakedAmountCard';
import LockedAmountCard from '../../components/LockedAmountCard';
import WithdrawableAmountCard from '../../components/WithdrawableAmountCard';
import StakeModal from '../../components/modals/StakeModal';
import UnstakeModal from '../../components/modals/UnstakeModal';
import PageWrapper from '../../components/PageWrapper';
import NetworkStatus from '../../components/NetworkStatus';

const Dashboard: React.FC = () => {
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [unstakeModalOpen, setUnstakeModalOpen] = useState(false);

  return (
    <PageWrapper violetHeader>
      <Box>
        <Container maxWidth={false}>
          <Box
            sx={{
              mt: 6,
              mb: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h4" fontWeight="bold" color="white">
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

import { Grid, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { FC } from 'react';
import {
  StakeCard,
  Stake,
  Rewards,
  HMTTable,
  StakingRewardsChart,
} from 'src/components/Staking';

export const Staking: FC = () => (
  <Box sx={{ px: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 } }}>
    <Box
      sx={{
        background: '#f6f7fe',
        borderRadius: {
          xs: '16px',
          sm: '16px',
          md: '24px',
          lg: '32px',
          xl: '40px',
        },
        padding: {
          xs: '24px 16px',
          md: '42px 54px',
          lg: '56px 72px',
          xl: '70px 90px',
        },
      }}
    >
      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StakeCard title="Stake HMT" hmt={0} usd={0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StakeCard title="HMT reward balance" hmt={0} usd={0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StakeCard title="Alllocated HMT" hmt={0} usd={0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StakeCard title="Slashed HMT" hmt={0} usd={0} />
        </Grid>
      </Grid>
      <Grid container spacing={4} sx={{ mt: 8 }}>
        <Grid item xs={12} md={6}>
          <Box
            sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <Typography color="primary" variant="h4" fontWeight={600} mb={4}>
              Stake your HMT
            </Typography>
            <Stake />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box
            sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <Typography color="primary" variant="h4" fontWeight={600} mb={4}>
              Rewards
            </Typography>
            <Rewards />
          </Box>
        </Grid>
      </Grid>
      <Box sx={{ mt: 8 }}>
        <Typography color="primary" variant="h4" fontWeight={600} mb={4}>
          Staking rewards
        </Typography>
        <StakingRewardsChart />
      </Box>
      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Box
            sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <Typography color="primary" variant="h4" fontWeight={600} mb={4}>
              Allocated HMT
            </Typography>
            <HMTTable />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box
            sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <Typography color="primary" variant="h4" fontWeight={600} mb={4}>
              Slashed HMT
            </Typography>
            <HMTTable />
          </Box>
        </Grid>
      </Grid>
    </Box>
  </Box>
);

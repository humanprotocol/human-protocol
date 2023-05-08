import { Button, Grid, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { FC } from 'react';
import humanTokenSvg from 'src/assets/human-token.svg';
import { PageWrapper } from 'src/components';
import {
  Stake,
  Rewards,
  HMTTable,
  HMTStatusTable,
  HMTStatusChart,
  RewardsHistory,
} from 'src/components/Staking';
import { ViewTitle } from 'src/components/ViewTitle';

export const Staking: FC = () => (
  <PageWrapper>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 4,
      }}
    >
      <ViewTitle title="My HMT" iconUrl={humanTokenSvg} />
      <Button color="primary" variant="contained" href="/configure-oracle">
        Configure your Oracle
      </Button>
    </Box>
    <Grid container spacing={4}>
      <Grid item xs={12} lg={6}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <HMTStatusTable />
        </Box>
      </Grid>
      <Grid item xs={12} lg={6}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <HMTStatusChart />
        </Box>
      </Grid>
    </Grid>
    <Grid container spacing={4} sx={{ mt: 8 }}>
      <Grid item xs={12} md={6}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography color="primary" variant="h4" fontWeight={600} mb={4}>
            Stake
          </Typography>
          <Stake />
        </Box>
      </Grid>
      <Grid item xs={12} md={6}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography color="primary" variant="h4" fontWeight={600} mb={4}>
            Rewards
          </Typography>
          <Rewards />
        </Box>
      </Grid>
    </Grid>
    <Box sx={{ mt: 8 }}>
      <Typography color="primary" variant="h4" fontWeight={600} mb={4}>
        Rewards History
      </Typography>
      <RewardsHistory />
    </Box>
    <Grid container spacing={4} sx={{ mt: 4 }}>
      <Grid item xs={12} lg={6}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography color="primary" variant="h4" fontWeight={600} mb={4}>
            Allocated HMT
          </Typography>
          <HMTTable />
        </Box>
      </Grid>
      <Grid item xs={12} lg={6}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography color="primary" variant="h4" fontWeight={600} mb={4}>
            Slashed HMT
          </Typography>
          <HMTTable />
        </Box>
      </Grid>
    </Grid>
  </PageWrapper>
);

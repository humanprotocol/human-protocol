import { Box, Grid, Typography } from '@mui/material';
import React from 'react';
import { JobsGraph } from '../../components/Dashboard/JobsGraph';
import { LiquidityData } from '../../components/Dashboard/LiquidityData';
import { OracleReputation } from '../../components/Dashboard/OracleRepuptation';
import { WorkersPerformance } from '../../components/Dashboard/WorkersPerformance';
import { StatusToggleButtons } from '../../components/Jobs/StatusToggleButtons';
import { JobTable } from '../../components/Jobs/Table';
import { NetworkSelect } from '../../components/NetworkSelect';
import { SearchField } from '../../components/SearchField';
import { JobStatus } from '../../types';

export default function Dashboard() {
  return (
    <Box>
      <Box
        mb={8}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" fontWeight={600}>
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
          <NetworkSelect />
          <SearchField />
        </Box>
      </Box>

      <Grid container spacing={4} mb={11}>
        <Grid item xs={12} sm={12} xl={6}>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <LiquidityData />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <OracleReputation />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <WorkersPerformance />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} sm={12} xl={6}>
          <JobsGraph />
        </Grid>
      </Grid>
      <Box>
        <Box
          sx={{
            mb: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h4">Jobs</Typography>
          <StatusToggleButtons />
        </Box>
      </Box>
      <JobTable status={JobStatus.LAUNCHED} />
    </Box>
  );
}

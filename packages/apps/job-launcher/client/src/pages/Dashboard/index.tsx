import { ChainId } from '@human-protocol/sdk';
import { Box, Grid, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { JobsGraph } from '../../components/Dashboard/JobsGraph';
import { LiquidityData } from '../../components/Dashboard/LiquidityData';
import { OracleReputation } from '../../components/Dashboard/OracleRepuptation';
import { StatusToggleButtons } from '../../components/Jobs/StatusToggleButtons';
import { JobTable } from '../../components/Jobs/Table';
import { NetworkSelect } from '../../components/NetworkSelect';
import { getStats } from '../../services/stats';
import { JobStatisticsDto, JobStatus } from '../../types';

export default function Dashboard() {
  const [chainId, setChainId] = useState<ChainId>(ChainId.ALL);
  const [status, setStatus] = useState<JobStatus>(JobStatus.LAUNCHED);
  const [stats, setStats] = useState<JobStatisticsDto>();

  useEffect(() => {
    const fetchStatsData = async () => {
      const stats = await getStats();
      setStats(stats);
    };

    fetchStatsData();
  }, []);

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
          <NetworkSelect
            showAllNetwork
            value={chainId}
            onChange={(e) => setChainId(e.target.value as ChainId)}
          />
        </Box>
      </Box>

      <Grid container spacing={4} mb={11}>
        <Grid item xs={12} sm={12} xl={6}>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <LiquidityData stats={stats} />
            </Grid>
            <Grid item xs={12}>
              <OracleReputation />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} sm={12} xl={6}>
          <JobsGraph stats={stats} />
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
          <StatusToggleButtons
            exclusive
            value={status}
            onChange={(e, value) => setStatus(value)}
          />
        </Box>
      </Box>
      <JobTable status={status} chainId={chainId} />
    </Box>
  );
}

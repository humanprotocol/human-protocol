import { Box, Button, Grid, Typography } from '@mui/material';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import lowAmountEscrowSvg from 'src/assets/low-amount-escrow.svg';
import { CardBarChart, CardStackedBarChart } from 'src/components/Cards';
import { ESCROW_NETWORKS } from 'src/constants';
import { useChainId, useEscrowDataByChainID } from 'src/state/escrow/hooks';

export const EscrowView = () => {
  const chainId = useChainId();
  const escrowData = useEscrowDataByChainID();

  const escrowSeries = useMemo(() => {
    return escrowData.lastMonthEvents.map((item) => ({
      date: dayjs(Number(item.timestamp) * 1000).format('DD/MM'),
      dailyEscrowAmounts: item.dailyEscrowAmounts,
      dailyPendingEvents: item.dailyPendingEvents,
    }));
  }, [escrowData]);

  const bulkTransferEvents = useMemo(() => {
    return escrowData.lastMonthEvents.map((item) => ({
      date: dayjs(Number(item.timestamp) * 1000).format('DD/MM'),
      value: item.dailyBulkTransferEvents,
    }));
  }, [escrowData]);

  const intermediateStorageEvents = useMemo(() => {
    return escrowData.lastMonthEvents.map((item) => ({
      date: dayjs(Number(item.timestamp) * 1000).format('DD/MM'),
      value: item.dailyIntermediateStorageEvents,
    }));
  }, [escrowData]);

  const totalEscrowEvents = useMemo(() => {
    return escrowData.lastMonthEvents.map((item) => ({
      date: dayjs(Number(item.timestamp) * 1000).format('DD/MM'),
      value: item.dailyTotalEvents,
    }));
  }, [escrowData]);

  if (escrowData.amount === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          background: '#fff',
          boxShadow:
            '0px 3px 1px -2px #E9EBFA, 0px 2px 2px rgba(233, 235, 250, 0.5), 0px 1px 5px rgba(233, 235, 250, 0.2)',
          borderRadius: { xs: '8px', xl: '16px' },
          px: { xs: '24px', md: '40px', lg: '60px', xl: '100px' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        <Box
          mt={{ xs: '24px', md: '48px', lg: '72px', xl: '94px' }}
          mb={{ xs: '36px', md: '60px', lg: '80px', xl: '128px' }}
        >
          <Typography
            color="primary"
            fontSize={{ xs: 24, sm: 36, md: 48, xl: 60 }}
            fontWeight={600}
            lineHeight={1.2}
          >
            Low amount of escrows,
            <br /> please run Fortune App.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: { xs: '24px', md: '60px' } }}
          >
            Run Fortune App
          </Button>
        </Box>
        <Box
          sx={{
            background: `url(${lowAmountEscrowSvg})`,
            width: 470,
            mt: '48px',
            display: { xs: 'none', md: 'block' },
          }}
        />
      </Box>
    );
  }

  return (
    <Grid container spacing={{ xs: 2, sm: 2, md: 3, lg: 4, xl: 5 }}>
      {escrowData.totalSupply && (
        <Grid item xs={12}>
          <Typography color="primary" textAlign="right">
            {ESCROW_NETWORKS[chainId]?.title} Token Supply:{' '}
            {escrowData.totalSupply}
          </Typography>
        </Grid>
      )}
      <Grid item xs={12}>
        <CardStackedBarChart
          series={escrowSeries}
          allEscrowAmount={escrowData.amount}
          pendingEventCount={escrowData.stats.pendingEventCount}
        />
      </Grid>
      <Grid item xs={12} sm={12} md={6} lg={4}>
        <CardBarChart
          title="BulkTransfer Events"
          totalValue={escrowData.stats.bulkTransferEventCount}
          series={bulkTransferEvents}
        />
      </Grid>
      <Grid item xs={12} sm={12} md={6} lg={4}>
        <CardBarChart
          title="IntermediateStorage Events"
          totalValue={escrowData.stats.intermediateStorageEventCount}
          series={intermediateStorageEvents}
        />
      </Grid>
      <Grid item xs={12} sm={12} md={6} lg={4}>
        <CardBarChart
          title="Total Number Of Escrows Events"
          totalValue={escrowData.stats.totalEventCount}
          series={totalEscrowEvents}
        />
      </Grid>
    </Grid>
  );
};

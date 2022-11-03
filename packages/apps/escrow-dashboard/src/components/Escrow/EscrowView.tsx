import { Box, Button, Grid, Typography } from '@mui/material';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import { CardBarChart, CardStackedBarChart } from 'src/components/Cards';
import useEscrowCounter from 'src/hooks/useEscrowCounter';
import useEscrowStatistics from 'src/hooks/useEscrowStatistics';
import useEventDayDatas from 'src/hooks/useEventDayDatas';

export const EscrowView = () => {
  const escrowStatistics = useEscrowStatistics();
  const eventDayDatas = useEventDayDatas();
  const escrowCounter = useEscrowCounter();

  const escrowSeries = useMemo(() => {
    if (eventDayDatas) {
      return eventDayDatas.map((item) => ({
        date: dayjs(Number(item.timestamp) * 1000).format('DD/MM'),
        dailyEscrowAmounts: Number(item.dailyEscrowAmounts),
        dailyPendingEvents: Number(item.dailyPendingEvents),
      }));
    }
    return [];
  }, [eventDayDatas]);

  const bulkTransferEvents = useMemo(() => {
    if (eventDayDatas) {
      return eventDayDatas.map((item) => ({
        date: dayjs(Number(item.timestamp) * 1000).format('DD/MM'),
        value: Number(item.dailyBulkTransferEvents),
      }));
    }
    return [];
  }, [eventDayDatas]);

  const intermediateStorageEvents = useMemo(() => {
    if (eventDayDatas) {
      return eventDayDatas.map((item) => ({
        date: dayjs(Number(item.timestamp) * 1000).format('DD/MM'),
        value: Number(item.dailyIntermediateStorageEvents),
      }));
    }
    return [];
  }, [eventDayDatas]);

  const totalEscrowEvents = useMemo(() => {
    if (eventDayDatas) {
      return eventDayDatas.map((item) => ({
        date: dayjs(Number(item.timestamp) * 1000).format('DD/MM'),
        value:
          Number(item.dailyBulkTransferEvents) +
          Number(item.dailyIntermediateStorageEvents) +
          Number(item.dailyPendingEvents),
      }));
    }
    return [];
  }, [eventDayDatas]);

  if (escrowCounter === undefined) {
    return null;
  }

  if (escrowCounter === 0) {
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
            background: `url(/images/low-amount-escrow.svg)`,
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
      <Grid item xs={12}>
        <CardStackedBarChart
          series={escrowSeries}
          allEscrowAmount={escrowCounter}
          pendingEventCount={escrowStatistics?.pendingEventCount}
        />
      </Grid>
      <Grid item xs={12} sm={12} md={6} lg={4}>
        <CardBarChart
          title="BulkTransfer Events"
          totalValue={escrowStatistics?.bulkTransferEventCount}
          series={bulkTransferEvents}
        />
      </Grid>
      <Grid item xs={12} sm={12} md={6} lg={4}>
        <CardBarChart
          title="IntermediateStorage Events"
          totalValue={escrowStatistics?.intermediateStorageEventCount}
          series={intermediateStorageEvents}
        />
      </Grid>
      <Grid item xs={12} sm={12} md={6} lg={4}>
        <CardBarChart
          title="Total Number Of Escrows Events"
          totalValue={
            escrowStatistics
              ? Number(escrowStatistics.intermediateStorageEventCount) +
                Number(escrowStatistics.bulkTransferEventCount) +
                Number(escrowStatistics.pendingEventCount)
              : 0
          }
          series={totalEscrowEvents}
        />
      </Grid>
    </Grid>
  );
};

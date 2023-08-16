import { Box, Tab, Tabs, Typography } from '@mui/material';
import dayjs from 'dayjs';
import numeral from 'numeral';
import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useHumanAppDataByChainId } from 'src/state/humanAppData/hooks';
import { EventDayData } from 'src/state/humanAppData/types';

enum TaskStatus {
  Total = 'Total',
  Pending = 'Pending',
  Solved = 'Solved',
  Paid = 'Paid',
  Cancelled = 'Cancelled',
}

export const TasksView = () => {
  const [tabValue, setTabValue] = useState(TaskStatus.Total);
  const eventDayDatas = useHumanAppDataByChainId();

  const seriesData = useMemo(() => {
    if (eventDayDatas) {
      const VALUES_BY_TYPE: Record<TaskStatus, keyof EventDayData> = {
        [TaskStatus.Total]: 'dailyEscrowAmounts',
        [TaskStatus.Pending]: 'dailyPendingStatusEventCount',
        [TaskStatus.Solved]: 'dailyEscrowAmounts',
        [TaskStatus.Paid]: 'dailyPaidStatusEventCount',
        [TaskStatus.Cancelled]: 'dailyCancelledStatusEventCount',
      };
      return eventDayDatas
        .map((d) => ({
          date: d.timestamp * 1000,
          value: Number(d[VALUES_BY_TYPE[tabValue]]),
        }))
        .reverse();
    }
    return [];
  }, [eventDayDatas, tabValue]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            background: '#fff',
            border: '1px solid #CBCFE6',
            borderRadius: '10px',
            padding: '30px',
          }}
        >
          <Typography
            color="text.primary"
            variant="body2"
            fontWeight={600}
            mb={2}
          >
            {dayjs(label).format('MMM D, YYYY')}
          </Typography>
          <Typography color="text.primary" variant="caption">
            {tabValue} Tasks
          </Typography>
          <Typography color="text.primary" variant="h6" fontWeight={500}>
            {numeral(payload[0].value).format('0a').toUpperCase()}
          </Typography>
        </Box>
      );
    }

    return null;
  };

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'background.paper',
        display: 'flex',
      }}
    >
      <Tabs
        orientation="vertical"
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        sx={{
          '& .MuiTabs-indicator': {
            // display: 'none',
            width: '100%',
            left: 0,
            height: '2px !important',
            marginTop: '46px',
          },
        }}
      >
        <Tab
          label="Total"
          value={TaskStatus.Total}
          sx={{ alignItems: 'flex-start' }}
        />
        <Tab
          label="Pending"
          value={TaskStatus.Pending}
          sx={{ alignItems: 'flex-start' }}
        />
        <Tab
          label="Solved"
          value={TaskStatus.Solved}
          sx={{ alignItems: 'flex-start' }}
        />
        <Tab
          label="Paid"
          value={TaskStatus.Paid}
          sx={{ alignItems: 'flex-start' }}
        />
        <Tab
          label="Cancelled"
          value={TaskStatus.Cancelled}
          sx={{ alignItems: 'flex-start' }}
        />
      </Tabs>
      <Box
        sx={{
          flexGrow: 1,
          borderRadius: '8px',
          background: '#F6F7FE',
          py: 10,
          px: 5,
          ml: { xs: 4, md: 6, xl: 12 },
          minHeight: 400,
        }}
      >
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <AreaChart data={seriesData} margin={{ right: 30, bottom: 10 }}>
            <defs>
              <linearGradient
                id="paint0_linear_4037_63345"
                x1="257"
                y1="0"
                x2="257"
                y2="276.5"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0.290598" stopColor="#CACFE8" stopOpacity="0.3" />
                <stop offset="1" stopColor="#E9ECFF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray={3} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#320A8D',
                fontSize: '14px',
                fontFamily: 'Inter',
                fontWeight: 500,
              }}
              tickFormatter={(value: any) => dayjs(value).format('MMM D')}
              tickMargin={12}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#320A8D',
                fontSize: '14px',
                fontFamily: 'Inter',
                fontWeight: 500,
              }}
              tickFormatter={(value: any) =>
                numeral(value).format('0a').toUpperCase()
              }
            />
            <Tooltip cursor={{ fill: '#dadef0' }} content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#320A8D"
              fill="url(#paint0_linear_4037_63345)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

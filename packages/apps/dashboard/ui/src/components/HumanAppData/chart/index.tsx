import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import numeral from 'numeral';
import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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
        {/* <Typography color="text.primary" variant="caption">
          {tab Value} Tasks
        </Typography> */}
        <Typography color="text.primary" variant="h6" fontWeight={500}>
          {numeral(payload[0].value).format('0.0a').toUpperCase()}
        </Typography>
      </Box>
    );
  }

  return null;
};

export const HumanAppDataChart = ({
  data,
  minWidth,
  minHeight,
}: {
  data: any;
  minWidth?: number;
  minHeight?: number;
}) => {
  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
      minWidth={minWidth}
      minHeight={minHeight}
    >
      <AreaChart data={data}>
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
            fontSize: '10px',
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
            fontSize: '10px',
            fontFamily: 'Inter',
            fontWeight: 500,
          }}
          tickFormatter={(value: any) =>
            numeral(value).format('0a').toUpperCase()
          }
          width={40}
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
  );
};

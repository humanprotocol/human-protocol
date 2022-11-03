import { Box, Typography, useTheme } from '@mui/material';
import numeral from 'numeral';
import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';

import { CardContainer } from '../Container';

interface ISeries {
  date: string;
  value: number;
}

interface IBarChartProps {
  title: string;
  totalValue?: string | number;
  series: ISeries[];
}

export default function BarChart({
  title,
  totalValue,
  series,
}: IBarChartProps) {
  const theme = useTheme();

  return (
    <CardContainer>
      <Typography variant="body2" color="primary" fontWeight={600} mb="4px">
        {title}
      </Typography>
      {totalValue && (
        <Typography
          variant="h2"
          color="primary"
          sx={{ fontSize: { xs: 32, md: 48, lg: 64, xl: 80 } }}
        >
          {numeral(totalValue).format('0,0')}
        </Typography>
      )}
      <Box sx={{ width: '100%', height: 190 }}>
        <ResponsiveContainer>
          <RechartsBarChart
            data={series}
            margin={{ top: 30, left: 4, right: 4 }}
          >
            <XAxis dataKey="date" axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="value" fill={theme.palette.primary.main} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </Box>
    </CardContainer>
  );
}

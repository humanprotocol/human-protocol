import { Box, Typography, useTheme } from '@mui/material';
import numeral from 'numeral';
import { FC } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';

import { Container } from '../Container';

type Series = {
  date: string;
  value: number;
};

type BarChartProps = {
  title: string;
  totalValue?: string | number;
  series: Series[];
};

export const BarChart: FC<BarChartProps> = ({ title, totalValue, series }) => {
  const theme = useTheme();

  return (
    <Container>
      <Typography variant="body2" color="primary" fontWeight={600} mb="4px">
        {title}
      </Typography>
      {totalValue !== undefined && (
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
            <XAxis
              dataKey="date"
              type="category"
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              ticks={[
                series[0].date,
                series[Math.ceil(series.length / 2) - 1].date,
                series[series.length - 1].date,
              ]}
              tick={{ fill: '#320A8D', fontSize: '12px', fontFamily: 'Inter' }}
              tickMargin={12}
              padding={{ left: 10, right: 10 }}
            />
            <Tooltip />
            <Bar dataKey="value" fill={theme.palette.primary.main} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
};

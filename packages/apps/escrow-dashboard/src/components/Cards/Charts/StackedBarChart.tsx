import { Box, Grid, Typography, useTheme } from '@mui/material';
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

type StackSeries = {
  date: string;
  dailyEscrowAmounts: number;
  dailyPendingEvents: number;
};

type StackedBarChartProps = {
  series: StackSeries[];
  allEscrowAmount?: string | number;
  pendingEventCount?: string | number;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          background: '#fff',
          border: '1px solid rgba(218, 222, 240, 0.8)',
          borderRadius: '16px',
          padding: '30px 38px',
        }}
      >
        <Typography color="text.primary" variant="body2" fontWeight={600}>
          {label}
        </Typography>
        <Box mt={2}>
          <Typography color="text.primary" variant="caption" component="p">
            Amount of Escrows
          </Typography>
          <Typography color="text.primary" variant="h6" fontWeight={500}>
            {payload[1].value}
          </Typography>
        </Box>
        <Box mt={2}>
          <Typography color="secondary.main" variant="caption" component="p">
            Escrows Pending Events
          </Typography>
          <Typography color="text.primary" variant="h6" fontWeight={500}>
            {payload[0].value}
          </Typography>
        </Box>
      </Box>
    );
  }

  return null;
};

export const StackedBarChart: FC<StackedBarChartProps> = ({
  series,
  allEscrowAmount,
  pendingEventCount,
}) => {
  const theme = useTheme();

  return (
    <Container>
      <Grid container>
        <Grid item container justifyContent="center" xs={12} sm={12} md={4}>
          <Grid item xs={12} sm={6} md={12}>
            <Typography variant="body2" color="primary" fontWeight={600}>
              Amount of Escrows
            </Typography>
            <Typography
              color="primary"
              variant="h2"
              lineHeight={1}
              mt={3}
              sx={{ fontSize: { xs: 32, md: 48, lg: 64, xl: 80 } }}
            >
              {numeral(allEscrowAmount).format('0,0')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={12}>
            <Typography variant="body2" color="secondary" fontWeight={600}>
              All Escrows Pending Events
            </Typography>
            <Typography
              color="primary"
              variant="h2"
              lineHeight={1}
              mt={3}
              sx={{ fontSize: { xs: 32, md: 48, lg: 64, xl: 80 } }}
            >
              {numeral(pendingEventCount).format('0,0')}
            </Typography>
          </Grid>
        </Grid>
        <Grid item xs={12} sm={12} md={8}>
          <Box sx={{ width: '100%', height: 362 }}>
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
                  ticks={[series[0]?.date, series[series.length - 1]?.date]}
                  tick={{
                    fill: '#320A8D',
                    fontSize: '12px',
                    fontFamily: 'Inter',
                  }}
                  tickMargin={12}
                  padding={{ left: 10, right: 10 }}
                />
                <Tooltip
                  cursor={{ fill: '#dadef0' }}
                  content={<CustomTooltip />}
                />
                <Bar
                  dataKey="dailyPendingEvents"
                  stackId="a"
                  fill={theme.palette.secondary.main}
                />
                <Bar
                  dataKey="dailyEscrowAmounts"
                  stackId="a"
                  fill={theme.palette.primary.main}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

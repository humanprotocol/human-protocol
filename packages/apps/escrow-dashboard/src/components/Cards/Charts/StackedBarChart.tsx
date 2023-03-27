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
            <Typography
              variant="body2"
              color="primary"
              fontWeight={600}
              mb="4px"
            >
              Amount of Escrows
            </Typography>
            <Typography
              variant="h2"
              color="primary"
              sx={{ fontSize: { xs: 32, md: 48, lg: 64, xl: 80 } }}
            >
              {numeral(allEscrowAmount).format('0,0')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={12}>
            <Typography
              variant="body2"
              color="secondary"
              fontWeight={600}
              mb="4px"
            >
              All Escrows Pending Events
            </Typography>
            <Typography
              variant="h2"
              color="secondary"
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
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <Tooltip />
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

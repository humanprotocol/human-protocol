import { Box, Grid, Typography } from '@mui/material';
import dayjs from 'dayjs';
import numeral from 'numeral';
import { FC, useMemo } from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import SOLVED_TASKS from '../../history-data/sovled_tasks.json';
import { CardContainer } from '../Cards';
import { TooltipIcon } from '../TooltipIcon';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          background: '#fff',
          border: '1px solid #CBCFE6',
          borderRadius: '10px',
          padding: '8px 16px',
        }}
      >
        <Typography color="text.primary" variant="h6" fontWeight={500}>
          {numeral(payload[0].value).format('0a').toUpperCase()}
        </Typography>
      </Box>
    );
  }

  return null;
};

export const SolvedTasksView: FC = () => {
  const solvedTasksCount = SOLVED_TASKS.reduce((acc, d) => acc + d.value, 0);

  const qoqGrowth = useMemo(() => {
    const currentTasks = SOLVED_TASKS[SOLVED_TASKS.length - 1].value;
    const previousTasks = SOLVED_TASKS[SOLVED_TASKS.length - 4].value;
    return numeral((currentTasks - previousTasks) / previousTasks).format('0%');
  }, []);

  return (
    <CardContainer sxProps={{ padding: { xs: '24px 32px', md: '48px 64px' } }}>
      <Grid container sx={{ height: '100%' }} spacing={2}>
        <Grid item xs={12} md={5} xl={4}>
          <Box mb={2}>
            <Typography
              variant="body2"
              color="primary"
              fontWeight={600}
              mb="8px"
            >
              {`Solved Tasks till ${dayjs(
                SOLVED_TASKS[SOLVED_TASKS.length - 1].date
              ).format('MMM D, YYYY')}`}
            </Typography>
            <Typography
              variant="h2"
              color="primary"
              fontWeight={800}
              lineHeight={1.125}
              sx={{ whiteSpace: 'nowrap' }}
              fontSize={{ xs: '55px', xl: '80px' }}
            >
              {numeral(solvedTasksCount).format('0.000 a').toUpperCase()}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="body2"
              color="secondary"
              fontWeight={600}
              mb="8px"
            >
              QoQ Growth
            </Typography>
            <Typography
              variant="h2"
              color="secondary"
              fontWeight={800}
              lineHeight={1.125}
              sx={{ whiteSpace: 'nowrap' }}
              fontSize={{ xs: '55px', xl: '80px' }}
            >
              {qoqGrowth}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={7} xl={8}>
          <ResponsiveContainer width="100%" height="100%" minHeight={300}>
            <AreaChart data={SOLVED_TASKS} margin={{ right: 30, bottom: 10 }}>
              <defs>
                <linearGradient
                  id="paint0_linear_4037_63345"
                  x1="257"
                  y1="0"
                  x2="257"
                  y2="276.5"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop
                    offset="0.290598"
                    stopColor="#CACFE8"
                    stopOpacity="0.3"
                  />
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
                tickFormatter={(value: any) => dayjs(value).format('MMM')}
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
              <Tooltip
                cursor={{ fill: '#dadef0' }}
                content={<CustomTooltip />}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#320A8D"
                fill="url(#paint0_linear_4037_63345)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Grid>
      </Grid>
      <TooltipIcon title="Sorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim." />
    </CardContainer>
  );
};

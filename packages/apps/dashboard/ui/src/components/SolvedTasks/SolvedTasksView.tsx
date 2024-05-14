import { Box, Grid, Typography, useMediaQuery, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import numeral from 'numeral';
import { FC, useMemo } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import { CardContainer } from '../Cards';
import { TooltipIcon } from '../TooltipIcon';
import { TOOLTIPS } from 'src/constants/tooltips';
import { useMonthlyTaskSummaries } from 'src/hooks/useMonthlyTaskSummaries';

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
          {numeral(payload[0].value).format('0.[00] a').toUpperCase()}
        </Typography>
      </Box>
    );
  }

  return null;
};

export const SolvedTasksView: FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data, isLoading } = useMonthlyTaskSummaries();

  const cumulativeSolvedTasks = useMemo(() => {
    if (!data) return [];

    return data.reduce((acc: any, d: any) => {
      acc.push({
        date: d.date,
        value: acc.length ? acc[acc.length - 1].value + d.value : d.value,
      });
      return acc;
    }, [] as any[]);
  }, [data]);

  const solvedTasksCount = useMemo(() => {
    if (!data) return 0;

    return data.reduce((acc: any, d: any) => acc + d.value, 0);
  }, [data]);

  return (
    <CardContainer
      sxProps={{ padding: { xs: '42px 32px 32px', md: '74px 64px 64px' } }}
    >
      {isLoading ? (
        <SkeletonTheme
          baseColor="rgba(0, 0, 0, 0.1)"
          highlightColor="rgba(0, 0, 0, 0.18)"
        >
          <Skeleton count={1} width="100%" height="320px" />
        </SkeletonTheme>
      ) : (
        <>
          <Grid container sx={{ height: '100%' }} spacing={{ xs: 4, md: 2 }}>
            <Grid item xs={12} md={5} xl={4}>
              <Box mb={2}>
                <Typography
                  variant="body2"
                  color="primary"
                  fontWeight={600}
                  mb="14px"
                >
                  {`Total number of tasks till ${dayjs(
                    data?.[(data?.length || 1) - 1].date
                  ).format('MMM D, YYYY')}`}
                </Typography>
                <Typography
                  variant="h2"
                  color="primary"
                  fontWeight={800}
                  lineHeight={1.125}
                  sx={{ whiteSpace: 'nowrap' }}
                  fontSize={{ xs: '40px', lg: '55px' }}
                >
                  {numeral(solvedTasksCount).format('0.[00] a').toUpperCase()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={7} xl={8}>
              <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                <AreaChart data={cumulativeSolvedTasks} margin={{ bottom: 10 }}>
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
                      fontSize: '10px',
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
                    width={48}
                    tick={{
                      fill: '#320A8D',
                      fontSize: '10px',
                      fontFamily: 'Inter',
                      fontWeight: 500,
                    }}
                    tickFormatter={(value: any) =>
                      numeral(value).format('0.[00] a').toUpperCase()
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
          <TooltipIcon
            position={isMobile ? 'topRight' : 'bottomLeft'}
            title={TOOLTIPS.SOLVED_TASKS}
          />
        </>
      )}
    </CardContainer>
  );
};

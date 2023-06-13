import { Box, Typography, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import numeral from 'numeral';
import { FC } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';

import { CardContainer } from '../Cards';

const SOLVED_TASKS = [
  { date: '2022-07-31', value: 2181348 },
  { date: '2022-08-31', value: 2537442 },
  { date: '2022-09-30', value: 7014852 },
  { date: '2022-10-31', value: 42615432 },
  { date: '2022-11-30', value: 88708986 },
  { date: '2022-12-31', value: 203793543 },
  { date: '2023-01-31', value: 209093427 },
  { date: '2023-02-28', value: 237012318 },
  { date: '2023-03-31', value: 212012559 },
  { date: '2023-04-30', value: 182462076 },
  { date: '2023-05-31', value: 148126905 },
];

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
          {dayjs(label).format('MMM YYYY')}
        </Typography>
        <Box mt={2}>
          <Typography color="text.primary" variant="caption" component="p">
            Task Solved
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

export const SolvedTasksView: FC = () => {
  const theme = useTheme();
  const solvedTasksCount = SOLVED_TASKS.reduce((acc, d) => acc + d.value, 0);

  return (
    <CardContainer>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-evenly',
        }}
      >
        <Box>
          <Typography variant="body2" color="primary" fontWeight={600} mb="8px">
            {`Solved Tasks till ${dayjs(
              SOLVED_TASKS[SOLVED_TASKS.length - 1].date
            ).format('MMM D, YYYY')}`}
          </Typography>
          <Typography
            variant="h2"
            color="primary"
            fontWeight={600}
            lineHeight={1.125}
          >
            {numeral(solvedTasksCount).format('0.000 a').toUpperCase()}
          </Typography>
        </Box>
        <Box sx={{ width: 400, height: 300 }}>
          <ResponsiveContainer>
            <RechartsBarChart
              data={SOLVED_TASKS}
              margin={{ top: 30, left: 4, right: 4 }}
            >
              <XAxis
                dataKey="date"
                type="category"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                ticks={[
                  SOLVED_TASKS[0].date,
                  SOLVED_TASKS[SOLVED_TASKS.length - 1].date,
                ]}
                tick={{
                  fill: '#320A8D',
                  fontSize: '12px',
                  fontFamily: 'Inter',
                }}
                tickFormatter={(value: any) => dayjs(value).format('MMM D')}
                tickMargin={12}
                padding={{ left: 10, right: 10 }}
              />
              <Tooltip
                cursor={{ fill: '#dadef0' }}
                content={<CustomTooltip />}
              />
              <Bar
                dataKey="value"
                fill={theme.palette.primary.main}
                barSize={16}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </CardContainer>
  );
};

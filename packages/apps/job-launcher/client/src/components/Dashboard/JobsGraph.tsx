import { Box, Button, Card, Typography, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import {
  BarChart as RechartsBarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import { JobStatisticsDto } from '../../types';

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
          {dayjs(label).format('YY/MM/DD')}
        </Typography>
        <Box
          mt={2}
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
            gap: '16px',
          }}
        >
          {payload.map((entry: any) => (
            <Box key={entry.name}>
              <Typography color="text.primary" variant="caption" component="p">
                Jobs {entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}
              </Typography>
              <Typography
                variant="h6"
                fontWeight={500}
                sx={{ color: entry.color }}
              >
                {entry.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return null;
};

export const JobsGraph = ({
  stats,
}: {
  stats: JobStatisticsDto | undefined;
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const data = stats?.jobsByStatusPerDay || [];

  return (
    <Card sx={{ height: '100%', boxSizing: 'border-box', padding: '60px' }}>
      <Typography variant="h4" fontWeight={600} mb={6}>
        Jobs Graph
      </Typography>

      {data.length > 0 ? (
        <Box sx={{ width: '100%', height: 300, mx: 'auto' }}>
          <ResponsiveContainer>
            <RechartsBarChart
              data={data}
              margin={{ top: 30, left: 4, right: 4 }}
            >
              <XAxis
                dataKey="date"
                type="category"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                ticks={[data[0].date, data[data.length - 1].date]}
                tick={{
                  fill: '#320A8D',
                  fontSize: '12px',
                  fontFamily: 'Inter',
                }}
                tickFormatter={(value: string) => dayjs(value).format('MMM D')}
                tickMargin={12}
                padding={{ left: 10, right: 10 }}
              />
              <Tooltip
                cursor={{ fill: '#dadef0' }}
                content={<CustomTooltip />}
              />
              <Bar
                dataKey="launched"
                stackId="a"
                fill={theme.palette.primary.main}
                barSize={16}
              />
              <Bar
                dataKey="partial"
                stackId="a"
                fill={theme.palette.secondary.main}
                barSize={16}
              />
              <Bar
                dataKey="completed"
                stackId="a"
                fill={theme.palette.success.main}
                barSize={16}
              />
              <Bar
                dataKey="canceled"
                stackId="a"
                fill={theme.palette.error.main}
                barSize={16}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', py: 8 }}>
          <Typography variant="h5" sx={{ flex: 1 }}>
            No data to show at the moment, data will be available once jobs are
            created
          </Typography>
          <Button
            variant="contained"
            sx={{ ml: 4 }}
            onClick={() => navigate('/jobs/create')}
          >
            + Create a job
          </Button>
        </Box>
      )}
    </Card>
  );
};

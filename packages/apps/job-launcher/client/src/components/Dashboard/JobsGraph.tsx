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

const JOBS_DATA = [
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
  { date: '2023-06-30', value: 147005424 },
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
          {dayjs(label).format('YY/MM')}
        </Typography>
        <Box
          mt={2}
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
            gap: '16px',
          }}
        >
          <Box>
            <Typography color="text.primary" variant="caption" component="p">
              Jobs Launched
            </Typography>
            <Typography color="text.primary" variant="h6" fontWeight={500}>
              35,845
            </Typography>
          </Box>
          <Box>
            <Typography color="text.primary" variant="caption" component="p">
              Jobs Completed
            </Typography>
            <Typography color="text.primary" variant="h6" fontWeight={500}>
              35,845
            </Typography>
          </Box>
          <Box>
            <Typography color="text.primary" variant="caption" component="p">
              Jobs Failed
            </Typography>
            <Typography color="text.primary" variant="h6" fontWeight={500}>
              35,845
            </Typography>
          </Box>
          <Box>
            <Typography color="text.primary" variant="caption" component="p">
              Jobs Pending
            </Typography>
            <Typography color="text.primary" variant="h6" fontWeight={500}>
              35,845
            </Typography>
          </Box>
          <Box>
            <Typography color="text.primary" variant="caption" component="p">
              Jobs Cancelled
            </Typography>
            <Typography color="text.primary" variant="h6" fontWeight={500}>
              35,845
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  return null;
};

export const JobsGraph = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const data = [];

  return (
    <Card sx={{ height: '100%', boxSizing: 'border-box', padding: '60px' }}>
      <Typography variant="h4" fontWeight={600} mb={6}>
        Jobs Graph
      </Typography>

      {data.length > 0 ? (
        <Box sx={{ width: 400, height: 300, mx: 'auto' }}>
          <ResponsiveContainer>
            <RechartsBarChart
              data={JOBS_DATA}
              margin={{ top: 30, left: 4, right: 4 }}
            >
              <XAxis
                dataKey="date"
                type="category"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                ticks={[
                  JOBS_DATA[0].date,
                  JOBS_DATA[JOBS_DATA.length - 1].date,
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
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', py: 8 }}>
          <Typography variant="h5" sx={{ flex: 1 }}>
            No data to show at the moment, data will be available once job are
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

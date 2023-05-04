import { Box, Divider, Grid, Stack, Typography } from '@mui/material';
import React, { FC } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Container } from '../Cards/Container';

const data = [
  {
    name: 'Page A',
    uv: 4000,
    pv: 2400,
    amt: 2400,
  },
  {
    name: 'Page B',
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: 'Page C',
    uv: 2000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: 'Page D',
    uv: 2780,
    pv: 3908,
    amt: 2000,
  },
  {
    name: 'Page E',
    uv: 1890,
    pv: 4800,
    amt: 2181,
  },
  {
    name: 'Page F',
    uv: 2390,
    pv: 3800,
    amt: 2500,
  },
  {
    name: 'Page G',
    uv: 3490,
    pv: 4300,
    amt: 2100,
  },
];

const RewardCard = ({
  title,
  hmtValue,
  usdValue,
}: {
  title: string;
  hmtValue: number;
  usdValue: number;
}) => {
  return (
    <Box
      sx={{ border: '1px solid #CBCFE6', borderRadius: '16px', py: 2, px: 3 }}
    >
      <Typography fontWeight={500} color="primary" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
        <Typography variant="h4" fontWeight={600} color="primary">
          0.00
        </Typography>
        <Typography fontSize={14} fontWeight={600} color="primary">
          HMT
        </Typography>
      </Box>
      <Typography variant="body2" fontWeight={600} color="text.secondary">
        $0.00
      </Typography>
    </Box>
  );
};

type RewardsHistoryProps = {};

export const RewardsHistory: FC<RewardsHistoryProps> = () => {
  return (
    <Container>
      <Grid container spacing={{ md: 4, xl: 8 }}>
        <Grid item xs={12} lg={6}>
          <Box
            sx={{
              background: '#F6F7FE',
              borderRadius: '16px',
              py: 4,
              px: { xs: 4, md: 8, xl: 11 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
              mb: 3,
            }}
          >
            <Box>
              <Typography
                fontSize={16}
                fontWeight={500}
                color="primary"
                gutterBottom
              >
                Total Earned
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                <Typography
                  fontSize={48}
                  lineHeight={1.1}
                  fontWeight={600}
                  color="primary"
                >
                  0.00
                </Typography>
                <Typography fontSize={14} fontWeight={600} color="primary">
                  HMT
                </Typography>
              </Box>
              <Typography fontSize={14} fontWeight={600} color="text.secondary">
                $0.00
              </Typography>
            </Box>
            <Box>
              <Stack direction="row" spacing={2}>
                <Typography
                  sx={{ minWidth: '120px' }}
                  variant="body2"
                  color="text.secondary"
                >
                  Withdrawn
                </Typography>
                <Typography variant="body2" color="text.primary">
                  0000.00 HMT
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  $0.00
                </Typography>
              </Stack>
              <Divider sx={{ my: 2, borderColor: '#320A8D' }} />
              <Stack direction="row" spacing={2}>
                <Typography
                  sx={{ minWidth: '120px' }}
                  variant="body2"
                  color="text.secondary"
                >
                  Withdrawable
                </Typography>
                <Typography variant="body2" color="text.primary">
                  0000.00 HMT
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  $0.00
                </Typography>
              </Stack>
            </Box>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <RewardCard title="Worker Payouts" hmtValue={0} usdValue={0} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <RewardCard title="Oracle Fees" hmtValue={0} usdValue={0} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <RewardCard title="Slashing Rewards" hmtValue={0} usdValue={0} />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Box sx={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer>
              <AreaChart
                data={data}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="uv"
                  stroke="#8884d8"
                  fill="#8884d8"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

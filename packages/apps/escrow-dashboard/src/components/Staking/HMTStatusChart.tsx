import { Box } from '@mui/material';
import React, { FC } from 'react';
import { Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Container } from '../Cards/Container';

const data = [
  { name: 'Allocated', value: 11, fill: '#f00' },
  { name: 'Locked', value: 29, fill: '#0f0' },
  { name: 'Avaliable', value: 48, fill: '#00f' },
];

type HMTStatusChartProps = {};

export const HMTStatusChart: FC<HMTStatusChartProps> = () => {
  return (
    <Container densed>
      <Box sx={{ width: '100%', height: '360px' }}>
        <ResponsiveContainer>
          <PieChart width={730} height={360}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              fill="#8884d8"
              legendType="square"
              label
              labelLine={false}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
};

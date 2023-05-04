import { Box } from '@mui/material';
import React, { FC } from 'react';
import { Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Container } from '../Cards/Container';

const data = [
  { name: 'Allocated', value: 11, fill: '#f9faff' },
  { name: 'Locked', value: 29, fill: '#858EC6' },
  { name: 'Avaliable', value: 48, fill: '#320A8D' },
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
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                value,
                index,
              }) => {
                const RADIAN = Math.PI / 180;
                const radius = 50 + innerRadius + (outerRadius - innerRadius);
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = Math.min(
                  cy + radius * Math.sin(-midAngle * RADIAN),
                  310
                );
                return (
                  <text
                    x={x}
                    y={y}
                    fill="#320A8D"
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                  >
                    <tspan x={x} dy="1em">
                      {value}%
                    </tspan>
                    <tspan x={x} dy="1em">
                      {data[index].name}
                    </tspan>
                  </text>
                );
              }}
              labelLine={false}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
};

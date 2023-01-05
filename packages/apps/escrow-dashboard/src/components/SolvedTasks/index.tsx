import { Box, Typography, useTheme } from '@mui/material';
import * as React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  ResponsiveContainer,
} from 'recharts';

import ViewTitle from 'src/components/ViewTitle';
import { CardContainer } from 'src/components/Cards/Container';

export const SolvedTasksContainer: React.FC<{}> = (): React.ReactElement => {
  const theme = useTheme();
  const series = [
    { date: '2022-10-01', value: 17 },
    { date: '2022-10-10', value: 40 },
    { date: '2022-10-20', value: 70 },
    { date: '2022-11-01', value: 97 },
    { date: '2022-11-07', value: 127 },
    { date: '2022-11-14', value: 160 },
    { date: '2022-11-28', value: 200 },
    { date: '2022-12-01', value: 247 },
  ];

  return (
    <Box
      id="solved-tasks-container"
      sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <Box display="flex" alignItems="center" flexWrap="wrap">
        <ViewTitle title="Solved Tasks" iconUrl="/images/user.svg" />
      </Box>
      <Box mt={{ xs: 4, md: 8 }} flex={1}>
        <CardContainer>
          <Typography variant="body2" color="primary" fontWeight={600} mb="4px">
            Solved tasks till December 31 2022
          </Typography>
          <Typography
            variant="h2"
            color="primary"
            fontWeight={600}
            sx={{ fontSize: { xs: 32, md: 48, lg: 64, xl: 80 } }}
          >
            247,392,072
          </Typography>
          <Box
            sx={{
              maxWidth: 432,
              height: 190,
              ml: 'auto',
            }}
          >
            <ResponsiveContainer>
              <RechartsBarChart
                data={series}
                margin={{ top: 30, left: 4, right: 4 }}
              >
                <Bar dataKey="value" fill={theme.palette.primary.main} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </Box>
          <Box mt={3} display="flex" justifyContent="flex-end" px={1}>
            <Box>
              <Typography
                variant="caption"
                component="p"
                color="#858EC6"
                textAlign="right"
              >
                Nov 22
              </Typography>
              <Typography variant="caption" component="p" color="primary">
                97 MILLION
              </Typography>
            </Box>
            <Box ml={19}>
              <Typography
                variant="caption"
                component="p"
                color="#858EC6"
                textAlign="right"
              >
                Dec 22
              </Typography>
              <Typography variant="caption" component="p" color="primary">
                247 MILLION
              </Typography>
            </Box>
          </Box>
        </CardContainer>
      </Box>
    </Box>
  );
};

export default SolvedTasksContainer;

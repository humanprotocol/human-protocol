import { Fragment } from 'react';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import ToggleButtons from '@/components/DataEntry/ToggleButtons';
import Typography from '@mui/material/Typography';

import { colorPalette } from '@/assets/styles/color-palette';
import { formatDate } from '@/helpers/formatDate';
import { formatNumber } from '@/helpers/formatNumber';
import { useIsMobile } from '@/utils/hooks/use-breakpoints';

const CustomSmallChartTooltip = ({
  payload,
  active,
}: TooltipProps<number, string>) => {
  if (active) {
    return (
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${colorPalette.fog.light}`,
          borderRadius: 2,
        }}
      >
        <Box px={1} py={0}>
          {payload?.map((elem) => (
            <Fragment key={elem.name}>
              <Typography variant="Tooltip">
                {formatDate(elem.payload.date, 'MMMM DD, YYYY')}
              </Typography>
              <Typography fontWeight={500} variant="body1">
                {elem.value ? elem.value.toLocaleString('en-US') : ''}
              </Typography>
            </Fragment>
          ))}
        </Box>
      </Card>
    );
  }
  return null;
};

interface SmallGraphProps {
  graphData: {
    date: string;
    value: number;
  }[];
  title: string;
}

const GraphSettings = ({ title }: { title: string }) => (
  <Stack
    direction={{ sm: 'column', md: 'row' }}
    justifyContent="end"
    alignItems="center"
    mt={{ xs: 1.5, md: 0 }}
    mb={{ xs: 0, md: 2 }}
    mr={{ xs: 0, md: 4 }}
    gap={2}
    flexWrap="wrap"
  >
    <Typography variant="body1" component="p">
      {title}
    </Typography>
    <ToggleButtons />
  </Stack>
);

const SmallGraph = ({ title, graphData }: SmallGraphProps) => {
  const isMobile = useIsMobile();

  return (
    <>
      {!isMobile && <GraphSettings title={title} />}
      <ResponsiveContainer height={isMobile ? 150 : 215}>
        <AreaChart
          data={graphData}
          margin={{
            top: 5,
            right: 50,
            left: 20,
          }}
        >
          <defs>
            <linearGradient id="value" x1="0" y1="0" x2="0" y2="1">
              <stop offset="90%" stopColor="#244CB20F" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#B4C2E505" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            style={{
              fontSize: 10,
              fontWeight: 500,
            }}
            axisLine={false}
            interval="preserveStartEnd"
            dataKey="date"
            stroke={colorPalette.fog.main}
            tickFormatter={(value) => formatDate(value, 'DD MMMM')}
            tick={{ dy: 10 }}
            tickSize={0}
          />
          <YAxis
            style={{
              fontSize: 10,
              fontWeight: 500,
            }}
            axisLine={false}
            dataKey="value"
            tick={{ dx: -10 }}
            tickSize={0}
            stroke={colorPalette.fog.main}
            tickFormatter={formatNumber}
          />
          <CartesianGrid
            stroke={colorPalette.fog.light}
            strokeDasharray={1}
            vertical={false}
          />
          <Tooltip content={<CustomSmallChartTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={colorPalette.secondary.main}
            fill="url(#value)"
          />
        </AreaChart>
      </ResponsiveContainer>
      {isMobile && <GraphSettings title={title} />}
    </>
  );
};

export default SmallGraph;

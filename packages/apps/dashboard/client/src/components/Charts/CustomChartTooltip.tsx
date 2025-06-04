import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { Grid, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { NumericFormat } from 'react-number-format';
import { TooltipProps } from 'recharts';

import { GraphPageChartDataConfigObject } from '@/components/Charts/AreaChart';
import { formatDate } from '@/helpers/formatDate';

const renderTitle = (title: string) => {
  const currentTitle: GraphPageChartDataConfigObject<string> = {
    totalTransactionAmount: 'Transfer Amount',
    totalTransactionCount: 'Transactions Count',
    solved: 'Number of Tasks',
    dailyUniqueReceivers: 'Unique Receivers',
    dailyUniqueSenders: 'Unique Senders',
  };
  return currentTitle[title as keyof GraphPageChartDataConfigObject<string>];
};

const CustomChartTooltip = ({
  payload,
  label,
  active,
}: TooltipProps<number, string>) => {
  if (active) {
    return (
      <Card
        sx={{
          border: '1px solid',
          borderColor: 'fog.light',
          borderRadius: '10px',
        }}
      >
        <Box p="6px 10px">
          <Typography variant="subtitle1" color="fog.main" fontWeight={500}>
            {formatDate(label, 'MMMM DD, YYYY')}
          </Typography>
          {payload?.map((elem) => (
            <Box
              key={elem.name}
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: 'repeat(2, 1fr)',
              }}
            >
              <Stack direction="row" alignItems="center" gap={1} width="100%">
                <Grid container alignItems="center" gap={1}>
                  <FiberManualRecordIcon
                    sx={{
                      color: elem.stroke,
                      fontSize: '12px',
                    }}
                  />
                  <Typography fontWeight={500} variant="subtitle1">
                    {renderTitle(elem.name ?? '')}
                  </Typography>
                </Grid>
              </Stack>
              <Grid container width="100%">
                <Typography
                  whiteSpace="nowrap"
                  textAlign="start"
                  variant="subtitle2"
                >
                  <NumericFormat
                    displayType="text"
                    value={elem.value}
                    decimalScale={2}
                  />{' '}
                  {elem.name === 'totalTransactionAmount' ? 'HMT' : ''}
                </Typography>
              </Grid>
            </Box>
          ))}
        </Box>
      </Card>
    );
  }
  return null;
};

export default CustomChartTooltip;

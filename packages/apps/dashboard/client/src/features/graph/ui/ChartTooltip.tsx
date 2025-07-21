import type { FC } from 'react';

import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { TooltipProps } from 'recharts';

import FormattedNumber from '@/shared/ui/FormattedNumber';

import formatDate from '../lib/formatDate';

import type { ChartDataConfigObject } from './AreaChart';

const renderTitle = (title: string) => {
  const currentTitle: ChartDataConfigObject<string> = {
    totalTransactionAmount: 'Transfer Amount',
    totalTransactionCount: 'Transactions Count',
    solved: 'Number of Tasks',
    dailyUniqueReceivers: 'Unique Receivers',
    dailyUniqueSenders: 'Unique Senders',
  };
  return currentTitle[title as keyof ChartDataConfigObject<string>];
};

const ChartTooltip: FC<TooltipProps<number, string>> = ({
  payload,
  label,
  active,
}) => {
  if (!active) return null;

  return (
    <Card
      sx={{
        border: '1px solid',
        borderColor: 'fog.light',
        borderRadius: '10px',
      }}
    >
      <Box p="6px 10px">
        <Typography variant="tooltip" color="fog.main">
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
                <Typography variant="tooltip">
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
                <FormattedNumber value={elem.value} decimalScale={2} />{' '}
                {elem.name === 'totalTransactionAmount' ? 'HMT' : ''}
              </Typography>
            </Grid>
          </Box>
        ))}
      </Box>
    </Card>
  );
};

export default ChartTooltip;

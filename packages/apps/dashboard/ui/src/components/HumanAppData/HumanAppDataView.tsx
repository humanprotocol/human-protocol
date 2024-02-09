import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FC, useMemo, useState } from 'react';

import { TooltipIcon } from '../TooltipIcon';
import { PaymentsView } from './views/Payments';
import { TasksView } from './views/Tasks';
import { TransactionsView } from './views/Transactions';
import { TOOLTIPS } from 'src/constants/tooltips';
import { useHumanAppData } from 'src/hooks/useHumanAppData';
import { useChainId, useDays } from 'src/state/humanAppData/hooks';

enum ViewButton {
  Transactions = 'Transactions',
  Tasks = 'Tasks',
  Payments = 'Payments',
}

const VIEW_BUTTONS = [
  { label: 'Transactions', value: ViewButton.Transactions },
  { label: 'Tasks', value: ViewButton.Tasks },
  { label: 'Payments', value: ViewButton.Payments },
];

export const HumanAppDataView: FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(600));
  const [viewButton, setViewButton] = useState(ViewButton.Transactions);
  const chainId = useChainId();
  const days = useDays();
  const { data, isLoading } = useHumanAppData(chainId);

  const transactionsSeries = useMemo(() => {
    if (data) {
      const cumulativeData = [...data[0].data[0].attributes.dailyHMTData]
        .map((d: any) => ({
          date: d.timestamp,
          value: Number(d.totalTransactionCount),
        }))
        .reverse()
        .reduce((acc, d) => {
          acc.push({
            date: d.date,
            value: acc.length ? acc[acc.length - 1].value + d.value : d.value,
          });
          return acc;
        }, [] as any[]);

      return cumulativeData.reverse().slice(0, days).reverse();
    }
    return [];
  }, [data, days]);

  const paymentsSeries = useMemo(() => {
    if (data) {
      const cumulativeData = [...data[0].data[0].attributes.dailyPaymentsData]
        .map((d: any) => ({
          date: d.timestamp,
          value: Number(d.totalAmountPaid),
        }))
        .reverse()
        .reduce((acc, d) => {
          acc.push({
            date: d.date,
            value: acc.length ? acc[acc.length - 1].value + d.value : d.value,
          });
          return acc;
        }, [] as any[]);

      return cumulativeData.reverse().slice(0, days).reverse();
    }
    return [];
  }, [data, days]);

  const taskSeries = useMemo(() => {
    if (data) {
      const cumulativeData = data[1].data
        .map((d: any) => {
          const multiplier = d.attributes.date <= '2022-11-30' ? 18 : 9;
          return {
            date: d.attributes.date,
            value: d.attributes.solved_count * multiplier,
          };
        })
        .reduce((acc: any, d: any) => {
          acc.push({
            date: d.date,
            value: acc.length ? acc[acc.length - 1].value + d.value : d.value,
          });
          return acc;
        }, [] as any[]);

      return cumulativeData.reverse().slice(0, days).reverse();
    }
    return [];
  }, [data, days]);

  const getTooltipTitle = (button: ViewButton) => {
    switch (button) {
      case ViewButton.Tasks:
        return TOOLTIPS.SOLVED_TASKS;
      case ViewButton.Payments:
        return TOOLTIPS.PAYMENTS;
      case ViewButton.Transactions:
        return TOOLTIPS.TRANSACTIONS;
    }
  };

  if (isMobile) {
    return (
      <Stack spacing={4}>
        <TransactionsView isLoading={isLoading} data={transactionsSeries} />
        <TasksView isLoading={isLoading} data={taskSeries} />
        <PaymentsView isLoading={isLoading} data={paymentsSeries} />
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        borderRadius: '16px',
        background: '#FFF',
        boxShadow:
          '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA;',
        padding: '42px 32px 32px',
        position: 'relative',
      }}
    >
      <ToggleButtonGroup
        exclusive
        fullWidth
        value={viewButton}
        onChange={(e, newButton) => {
          if (newButton === null) return;
          setViewButton(newButton);
        }}
      >
        {VIEW_BUTTONS.map(({ label, value }) => (
          <ToggleButton
            key={label}
            value={value}
            aria-label={label}
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              borderColor: 'text.secondary',
              minWidth: 50,
            }}
            size="small"
          >
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Box mt={3} mb={3} sx={{ overflow: 'auto' }}>
        {viewButton === ViewButton.Transactions && (
          <TransactionsView isLoading={isLoading} data={transactionsSeries} />
        )}
        {viewButton === ViewButton.Tasks && (
          <TasksView isLoading={isLoading} data={taskSeries} />
        )}
        {viewButton === ViewButton.Payments && (
          <PaymentsView isLoading={isLoading} data={paymentsSeries} />
        )}
      </Box>
      <TooltipIcon title={getTooltipTitle(viewButton)} />
    </Box>
  );
};

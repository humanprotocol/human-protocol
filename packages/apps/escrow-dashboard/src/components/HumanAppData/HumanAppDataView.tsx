import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FC, useState } from 'react';

import { TooltipIcon } from '../TooltipIcon';
import { PaymentsView } from './views/Payments';
import { TasksView } from './views/Tasks';
import { TransactionsView } from './views/Transactions';
import { WorkersView } from './views/Workers';
import { TOOLTIPS } from 'src/constants/tooltips';

enum ViewButton {
  Tasks = 'Tasks',
  Workers = 'Workers',
  Payments = 'Payments',
  Transactions = 'Transactions',
}

const VIEW_BUTTONS = [
  { label: 'Tasks', value: ViewButton.Tasks },
  { label: 'Workers', value: ViewButton.Workers },
  { label: 'Payments', value: ViewButton.Payments },
  { label: 'Transactions', value: ViewButton.Transactions },
];

export const HumanAppDataView: FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(600));
  const [viewButton, setViewButton] = useState(ViewButton.Tasks);

  const getTooltipTitle = (button: ViewButton) => {
    switch (button) {
      case ViewButton.Tasks:
        return TOOLTIPS.TASKS;
      case ViewButton.Workers:
        return TOOLTIPS.WORKERS;
      case ViewButton.Payments:
        return TOOLTIPS.PAYMENTS;
      case ViewButton.Transactions:
        return TOOLTIPS.TRANSACTIONS;
    }
  };

  if (isMobile) {
    return (
      <Stack spacing={4}>
        <TasksView />
        <WorkersView />
        <PaymentsView />
        <TransactionsView />
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
        pt: 5,
        px: 4,
        pb: 7,
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
      <Box mt={3} sx={{ overflow: 'auto' }}>
        {viewButton === ViewButton.Tasks && <TasksView />}
        {viewButton === ViewButton.Workers && <WorkersView />}
        {viewButton === ViewButton.Payments && <PaymentsView />}
        {viewButton === ViewButton.Transactions && <TransactionsView />}
      </Box>
      <TooltipIcon title={getTooltipTitle(viewButton)} />
    </Box>
  );
};

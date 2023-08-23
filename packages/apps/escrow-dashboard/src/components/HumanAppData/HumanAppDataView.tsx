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
import { HMTView } from './views/HMT';
import { PaymentsView } from './views/Payments';
import { TasksView } from './views/Tasks';
import { WorkersView } from './views/Workers';

enum ViewButton {
  Tasks = 'Tasks',
  Workers = 'Workers',
  Payments = 'Payments',
  HMT = 'HMT',
}

const VIEW_BUTTONS = [
  { label: 'Tasks', value: ViewButton.Tasks },
  { label: 'Workers', value: ViewButton.Workers },
  { label: 'Payments', value: ViewButton.Payments },
  { label: 'HMT', value: ViewButton.HMT },
];

export const HumanAppDataView: FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(600));
  const [viewButton, setViewButton] = useState(ViewButton.Tasks);

  if (isMobile) {
    return (
      <Stack spacing={4}>
        <TasksView />
        <WorkersView />
        <PaymentsView />
        <HMTView />
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
        py: 5,
        px: 4,
        position: 'relative',
      }}
    >
      <ToggleButtonGroup
        exclusive
        fullWidth
        value={viewButton}
        onChange={(e, newButton) => setViewButton(newButton)}
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
      <Box mt={3}>
        {viewButton === ViewButton.Tasks && <TasksView />}
        {viewButton === ViewButton.Workers && <WorkersView />}
        {viewButton === ViewButton.Payments && <PaymentsView />}
        {viewButton === ViewButton.HMT && <HMTView />}
      </Box>
      <TooltipIcon title="Sorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim." />
    </Box>
  );
};

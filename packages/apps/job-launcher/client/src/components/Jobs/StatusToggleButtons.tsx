import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup, {
  ToggleButtonGroupProps,
} from '@mui/material/ToggleButtonGroup';
import React, { FC } from 'react';
import { JobStatus } from '../../types';

const RANGE_BUTTONS = [
  { label: 'Launched', value: JobStatus.LAUNCHED },
  { label: 'Pending', value: JobStatus.PENDING },
  { label: 'Partial', value: JobStatus.PARTIAL },
  { label: 'Completed', value: JobStatus.COMPLETED },
  { label: 'Canceled', value: JobStatus.CANCELED },
  { label: 'Failed', value: JobStatus.FAILED },
];

export const StatusToggleButtons: FC<ToggleButtonGroupProps> = (props) => {
  return (
    <ToggleButtonGroup {...props}>
      {RANGE_BUTTONS.map(({ label, value }) => (
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
        >
          {label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

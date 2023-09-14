import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import * as React from 'react';

const RANGE_BUTTONS = [
  { label: 'All', value: 'All' },
  { label: 'Launched', value: 'Launched' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
  { label: 'Failed', value: 'Failed' },
];

export function StatusToggleButtons() {
  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newValue: number
  ) => {
    console.log(newValue);
  };

  return (
    <ToggleButtonGroup value={'All'} exclusive onChange={handleChange}>
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
}

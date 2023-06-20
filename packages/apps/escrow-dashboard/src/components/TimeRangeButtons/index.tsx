import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { AppState, useAppDispatch } from 'src/state';
import { setRange } from 'src/state/escrow/reducer';

const RANGE_BUTTONS = [
  { label: '1W', value: 7 },
  { label: '1M', value: 30 },
  { label: '3M', value: 90 },
  { label: '6M', value: 180 },
  { label: '1Y', value: 365 },
  { label: 'Max', value: 1000 },
];

export default function TimeRangeButtons() {
  const { range } = useSelector((state: AppState) => state.escrow);
  const dispatch = useAppDispatch();

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newValue: number
  ) => {
    dispatch(setRange(newValue));
  };

  return (
    <ToggleButtonGroup
      value={range}
      exclusive
      onChange={handleChange}
      aria-label="time range"
    >
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

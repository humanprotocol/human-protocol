import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { AppState, useAppDispatch } from 'src/state';
import { setDays } from 'src/state/humanAppData/reducer';

const RANGE_BUTTONS = [
  { label: '1W', value: 7 },
  { label: '1M', value: 30 },
  { label: '3M', value: 90 },
  { label: '6M', value: 180 },
  { label: '1Y', value: 365 },
  { label: 'Max', value: 1000 },
];

export default function TimeRangeButtons({
  fullWidth,
}: {
  fullWidth?: boolean;
}) {
  const { days } = useSelector((state: AppState) => state.humanAppData);
  const dispatch = useAppDispatch();

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newValue: number | null
  ) => {
    if (newValue === null) return;
    dispatch(setDays(newValue));
  };

  return (
    <ToggleButtonGroup
      value={days}
      exclusive
      onChange={handleChange}
      aria-label="time range"
      fullWidth={fullWidth}
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
            padding: '10px 11px',
          }}
        >
          {label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

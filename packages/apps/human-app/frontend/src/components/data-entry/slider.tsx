import { Controller } from 'react-hook-form';
import type { SliderProps } from '@mui/material/Slider';
import SliderMui from '@mui/material/Slider';
import type { ReactNode } from 'react';

interface InputProps extends Omit<SliderProps, 'name'> {
  max: number;
  min: number;
  step?: number;
  name: string;
  customMarks?: ReactNode;
}

export function Slider({
  name,
  max,
  min,
  step,
  customMarks,
  ...rest
}: InputProps) {
  return (
    <Controller
      name={name}
      render={({ field }) => (
        <>
          <SliderMui
            {...field}
            max={max}
            min={min}
            step={step || 10}
            valueLabelDisplay="auto"
            {...rest}
          />
          {customMarks ? customMarks : null}
        </>
      )}
    />
  );
}

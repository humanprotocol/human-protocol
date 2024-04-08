import type { SelectProps } from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import SelectMui from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { Controller } from 'react-hook-form';
import InputLabel from '@mui/material/InputLabel';

export interface OptionsProps {
  id: number;
  name: string;
  value: string;
}

interface SelectComponentProps extends Omit<SelectProps, 'name' | 'error'> {
  options: OptionsProps[];
  name: string;
  label?: string;
  ariaLabelledby?: string;
}

export function Select({
  ariaLabelledby,
  name,
  label,
  options,
  ...props
}: SelectComponentProps) {
  return (
    <Controller
      name={name}
      render={({ field, fieldState }) => (
        <FormControl fullWidth>
          {label ? <InputLabel id={`${name}-label`}>{label}</InputLabel> : null}
          <SelectMui
            {...field}
            aria-labelledby={ariaLabelledby}
            error={Boolean(fieldState.error)}
            labelId={`${name}-label`}
            {...props}
            label={label}
          >
            {options.map((elem) => (
              <MenuItem key={crypto.randomUUID().toString()} value={elem.value}>
                {elem.name}
              </MenuItem>
            ))}
          </SelectMui>
        </FormControl>
      )}
    />
  );
}

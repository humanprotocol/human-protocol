import type { SelectProps } from '@mui/material/Select';
import FormHelperText from '@mui/material/FormHelperText';
import SelectMui from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
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
        <FormControl
          error={Boolean(fieldState.error)}
          fullWidth
          variant="standard"
        >
          {label ? <InputLabel id={`${name}-label`}>{label}</InputLabel> : null}
          <SelectMui
            {...field}
            aria-labelledby={ariaLabelledby || name}
            error={Boolean(fieldState.error)}
            labelId={`${name}-label`}
            {...props}
          >
            {options.map((elem) => (
              <MenuItem key={elem.id} value={elem.value}>
                {elem.name}
              </MenuItem>
            ))}
          </SelectMui>
          <FormHelperText>{fieldState.error?.message}</FormHelperText>
        </FormControl>
      )}
    />
  );
}

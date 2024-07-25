import { Controller } from 'react-hook-form';
import type { RadioGroupProps as RadioGroupPropsMui } from '@mui/material/RadioGroup';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import FormHelperText from '@mui/material/FormHelperText';

interface RadioGroupProps extends Omit<RadioGroupPropsMui, 'name' | 'error'> {
  name: string;
  ariaLabelledby?: string;
  groupLabel?: string;
  options: { label: string; value: string | number }[];
}

export function RadioButton({
  name,
  ariaLabelledby,
  options,
  groupLabel,
  ...rest
}: RadioGroupProps) {
  return (
    <Controller
      name={name}
      render={({ field, fieldState }) => (
        <FormControl error={Boolean(fieldState.error)}>
          {groupLabel ? (
            <FormLabel id={ariaLabelledby || name}>{groupLabel}</FormLabel>
          ) : null}
          <RadioGroup
            {...field}
            aria-labelledby={ariaLabelledby || name}
            name={name}
            {...rest}
          >
            {options.map(({ label, value }) => (
              <FormControlLabel
                control={<Radio />}
                key={value}
                label={label}
                value={value}
              />
            ))}
          </RadioGroup>
          <FormHelperText>{fieldState.error?.message}</FormHelperText>
        </FormControl>
      )}
    />
  );
}

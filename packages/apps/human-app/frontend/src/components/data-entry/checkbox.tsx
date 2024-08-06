import { Controller } from 'react-hook-form';
import type { CheckboxProps } from '@mui/material/Checkbox';
import CheckboxMui from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { colorPalette } from '@/styles/color-palette';

interface InputProps extends Omit<CheckboxProps, 'name' | 'error'> {
  name: string;
  label?: string;
}

export function Checkbox({ name, label = '', ...rest }: InputProps) {
  return (
    <Controller
      name={name}
      render={({ field: { value, ...restField }, fieldState }) => (
        <Stack alignItems="center" direction="row" display="inline">
          <FormControlLabel
            control={
              <CheckboxMui
                //Checkbox materialUi doesn't have an error props, we need to change color when error appears.
                // Also, formControl component doesn't change a checkbox color when error appear
                sx={
                  fieldState.error
                    ? { color: colorPalette.error.main }
                    : undefined
                }
                {...restField}
                checked={typeof value === 'boolean' ? value : undefined}
                name={name}
                {...rest}
              />
            }
            label={<Typography>{label}</Typography>}
          />
        </Stack>
      )}
    />
  );
}

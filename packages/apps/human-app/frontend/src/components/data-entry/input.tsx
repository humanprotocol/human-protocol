import { Controller } from 'react-hook-form';
import type { TextFieldProps } from '@mui/material/TextField';
import TextField from '@mui/material/TextField';
import { Typography } from '@mui/material';
import { colorPalette } from '@/styles/color-palette';

export interface InputProps
  extends Omit<TextFieldProps, 'name' | 'error' | 'helperText'> {
  name: string;
  label?: string;
  autoComplete?: string;
  customError?: React.ReactNode;
}

export function Input({
  name,
  autoComplete,
  label,
  customError,
  ...rest
}: InputProps) {
  return (
    <Controller
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          FormHelperTextProps={{ component: 'div' }}
          autoComplete={autoComplete || name}
          error={Boolean(fieldState.error)}
          fullWidth
          helperText={
            <Typography
              color={customError ? undefined : colorPalette.error.main}
              component="div"
              variant="helperText"
            >
              {customError ? customError : fieldState.error?.message}
            </Typography>
          }
          label={label}
          name={name}
          variant="outlined"
          {...rest}
        />
      )}
    />
  );
}

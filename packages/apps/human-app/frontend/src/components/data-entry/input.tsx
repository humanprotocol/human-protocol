import { Controller } from 'react-hook-form';
import type { TextFieldProps } from '@mui/material/TextField';
import TextField from '@mui/material/TextField';

export interface InputProps
  extends Omit<TextFieldProps, 'name' | 'error' | 'helperText'> {
  name: string;
  label?: string;
  autoComplete?: string;
  isCustomError?: boolean;
}

export function Input({
  name,
  autoComplete,
  label,
  isCustomError = false,
  ...rest
}: InputProps) {
  return (
    <Controller
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          autoComplete={autoComplete || name}
          error={Boolean(fieldState.error)}
          fullWidth
          helperText={isCustomError ? undefined : fieldState.error?.message}
          label={label}
          name={name}
          variant="outlined"
          {...rest}
        />
      )}
    />
  );
}

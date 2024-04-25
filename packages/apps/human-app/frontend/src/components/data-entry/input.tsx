import { Controller } from 'react-hook-form';
import type { TextFieldProps } from '@mui/material/TextField';
import TextField from '@mui/material/TextField';
import { Typography } from '@mui/material';
import { colorPalette } from '@/styles/color-palette';
import type { InputMask } from '@/components/data-entry/input-masks/input-masks';
import { InputMasks } from '@/components/data-entry/input-masks/input-masks';

export interface InputProps
  extends Omit<TextFieldProps, 'name' | 'error' | 'helperText'> {
  name: string;
  label?: string;
  autoComplete?: string;
  customError?: React.ReactNode;
  mask?: InputMask;
}

export function Input({
  name,
  autoComplete,
  label,
  customError,
  mask,
  ...rest
}: InputProps) {
  return (
    <Controller
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          FormHelperTextProps={{ component: 'div' }}
          InputProps={
            mask
              ? {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any -- disable
                  inputComponent: InputMasks[mask] as any,
                }
              : undefined
          }
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

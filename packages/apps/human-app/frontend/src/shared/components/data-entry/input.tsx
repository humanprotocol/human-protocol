import { Controller } from 'react-hook-form';
import { type TextFieldProps, TextField, Typography } from '@mui/material';

import { type InputMask } from '@/shared/components/data-entry/input-masks';

type OmittedProps = Omit<TextFieldProps, 'name' | 'error' | 'helperText'>;
export interface InputProps extends OmittedProps {
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
          variant="outlined"
          autoComplete={autoComplete ?? name}
          error={!!fieldState.error}
          fullWidth
          helperText={
            <Typography
              component="div"
              variant="helperText"
              sx={{ color: customError ? undefined : 'error.main' }}
            >
              {customError ? customError : fieldState.error?.message}
            </Typography>
          }
          label={label}
          name={name}
          sx={{
            input: {
              '&:-webkit-autofill': {
                WebkitBoxShadow: `0 0 0 30px transparent inset !important`,
                transition:
                  'background-color 5000s ease-in-out 0s, color 5000s ease-in-out 0s',
              },
            },
          }}
          {...rest}
          slotProps={{
            ...rest.slotProps,
            formHelperText: {
              component: 'div',
              ...rest.slotProps?.formHelperText,
            },
            input: {
              ...rest.slotProps?.input,
              ...(mask ? { inputComponent: mask as any } : {}),
            },
          }}
        />
      )}
    />
  );
}

import { Controller } from 'react-hook-form';
import type { TextFieldProps } from '@mui/material/TextField';
import TextField from '@mui/material/TextField';
import { Typography } from '@mui/material';
import type { InputMask } from '@/components/data-entry/input-masks/input-masks';
import { InputMasks } from '@/components/data-entry/input-masks/input-masks';
import { useColorMode } from '@/hooks/use-color-mode';

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
  const { colorPalette } = useColorMode();

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
          autoComplete={autoComplete ?? name}
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
          sx={{
            input: {
              '&:-webkit-autofill': {
                '-webkit-box-shadow': `0 0 0 30px ${colorPalette.backgroundColor} inset !important`,
                '-webkit-text-fill-color': `${colorPalette.text.primary} !important`,
                transition:
                  'background-color 5000s ease-in-out 0s, color 5000s ease-in-out 0s',
              },
            },
          }}
          variant="outlined"
          {...rest}
        />
      )}
    />
  );
}

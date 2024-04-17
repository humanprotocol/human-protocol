import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import React, { useState } from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { Grid, Typography } from '@mui/material';
import { useFormContext, useFormState } from 'react-hook-form';
import { Input, type InputProps } from '@/components/data-entry/input';
import {
  PasswordCheckLabel,
  type PasswordCheck,
} from '@/components/data-entry/password/password-check-label';

type CommonProps = InputProps & { type?: never };

type PasswordProps =
  | (CommonProps & { passwordCheckHeader?: never; passwordChecks?: never })
  | (CommonProps & {
      passwordCheckHeader: string;
      passwordChecks: PasswordCheck[];
    });

export function Password(props: PasswordProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { getValues, watch } = useFormContext();
  const { isSubmitted } = useFormState();
  watch(props.name);
  const password = getValues()[props.name] as unknown;

  const handleClickShowPassword = () => {
    setShowPassword((show) => !show);
  };

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const customError = props.passwordCheckHeader ? (
    <Grid container gap={1}>
      <Typography variant="helperText">{props.passwordCheckHeader}</Typography>
      <Grid columnGap="1rem" container flexWrap="wrap" width="100%">
        {props.passwordChecks.map((checks) => {
          return (
            <PasswordCheckLabel
              isSubmitted={isSubmitted}
              {...checks}
              key={crypto.randomUUID()}
              password={password}
            />
          );
        })}
      </Grid>
    </Grid>
  ) : null;

  return (
    <Input
      {...props}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              edge="end"
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      customError={customError}
      type={showPassword ? 'text' : 'password'}
    />
  );
}

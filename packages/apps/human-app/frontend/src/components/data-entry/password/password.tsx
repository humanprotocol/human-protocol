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
import { colorPalette } from '@/styles/color-palette';

type CommonProps = InputProps & { type?: never };

type PasswordProps =
  | (CommonProps & { passwordCheckHeader?: never; passwordChecks?: never })
  | (CommonProps & {
      passwordCheckHeader: string;
      passwordChecks: PasswordCheck[];
    });

export function Password({
  passwordCheckHeader,
  passwordChecks,
  ...rest
}: PasswordProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { getValues, watch } = useFormContext();
  const { isSubmitted } = useFormState();
  watch(rest.name);
  const password = getValues()[rest.name] as unknown;

  const handleClickShowPassword = () => {
    setShowPassword((show) => !show);
  };

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const customError = passwordCheckHeader ? (
    <Grid container gap={1}>
      <Typography
        sx={{ color: colorPalette.primary.dark }}
        variant="helperText"
      >
        {passwordCheckHeader}
      </Typography>
      <Grid columnGap="1rem" container flexWrap="wrap" width="100%">
        {passwordChecks.map((checks) => {
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
      {...rest}
      InputProps={{
        endAdornment: (
          <InputAdornment
            position="end"
            sx={{
              marginLeft: 0,
            }}
          >
            <IconButton
              aria-label="toggle password visibility"
              edge="end"
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
            >
              {showPassword ? (
                <VisibilityOff sx={{ fill: colorPalette.primary.dark }} />
              ) : (
                <Visibility sx={{ fill: colorPalette.primary.dark }} />
              )}
            </IconButton>
          </InputAdornment>
        ),
      }}
      customError={customError}
      onKeyDown={(e) => {
        // ignore space
        if (e.keyCode === 32) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      type={showPassword ? 'text' : 'password'}
    />
  );
}

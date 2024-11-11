import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import React, { useState } from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { Input, type InputProps } from '@/components/data-entry/input';
import { useColorMode } from '@/hooks/use-color-mode';

type PasswordProps = InputProps & { type?: never };

export function Password(props: PasswordProps) {
  const { colorPalette } = useColorMode();
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword((show) => !show);
  };

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  return (
    <Input
      {...props}
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

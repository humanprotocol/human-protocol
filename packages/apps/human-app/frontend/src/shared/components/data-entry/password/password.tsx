import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useState, MouseEvent } from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { Input, type InputProps } from '@/shared/components/data-entry/input';
import { useColorMode } from '@/shared/contexts/color-mode';

type PasswordProps = InputProps & { type?: never };

export function Password(props: PasswordProps) {
  const { colorPalette } = useColorMode();
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword((show) => !show);
  };

  const handleMouseDownPassword = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <Input
      {...props}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end" sx={{ ml: 0 }}>
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
        },
      }}
      onKeyDown={(e) => {
        if (e.key === 'Space') {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      type={showPassword ? 'text' : 'password'}
    />
  );
}

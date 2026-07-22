import { useState, MouseEvent } from 'react';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { IconButton, InputAdornment } from '@mui/material';
import { Input, type InputProps } from '@/shared/components/data-entry/input';

type PasswordProps = InputProps & { type?: never };

export function Password(props: PasswordProps) {
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
                  <VisibilityOff sx={{ fill: '#fa2a75' }} />
                ) : (
                  <Visibility sx={{ fill: '#fa2a75' }} />
                )}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      type={showPassword ? 'text' : 'password'}
    />
  );
}

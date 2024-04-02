import type { ButtonProps } from '@mui/material/Button';
import { Button as ButtonMui } from '@mui/material';
import { forwardRef } from 'react';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => {
    return (
      <ButtonMui ref={ref} {...props}>
        {children}
      </ButtonMui>
    );
  }
);

Button.displayName = 'Button';

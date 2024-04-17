import type { Link, LinkProps } from 'react-router-dom';
import type { ButtonProps } from '@mui/material/Button';
import { Button as ButtonMui } from '@mui/material';
import { forwardRef } from 'react';

type CustomButtonProps = ButtonProps &
  Partial<LinkProps> & {
    component?: typeof Link;
  };

export const Button = forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ children, ...props }, ref) => {
    return (
      <ButtonMui ref={ref} {...props}>
        {children}
      </ButtonMui>
    );
  }
);

Button.displayName = 'Button';

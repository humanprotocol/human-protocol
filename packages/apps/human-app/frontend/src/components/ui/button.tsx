import type { Link, LinkProps } from 'react-router-dom';
import { forwardRef } from 'react';
import type { LoadingButtonProps } from '@mui/lab';
import { LoadingButton } from '@mui/lab';

export type CustomButtonProps = LoadingButtonProps &
  Partial<LinkProps> & {
    component?: typeof Link;
  };

export const Button = forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ children, ...props }, ref) => {
    return (
      <LoadingButton ref={ref} {...props}>
        {children}
      </LoadingButton>
    );
  }
);

Button.displayName = 'Button';

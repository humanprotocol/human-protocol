import type { Link, LinkProps } from 'react-router-dom';
import { forwardRef } from 'react';
import MuiButton from '@mui/material/Button';
import type { ButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

export type CustomButtonProps = ButtonProps &
  Partial<LinkProps> & {
    component?: typeof Link;
    loading?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ children, loading, disabled, ...props }, ref) => {
    return (
      <MuiButton ref={ref} {...props} disabled={disabled || loading}>
        <>{loading ? <CircularProgress size={24} /> : children}</>
      </MuiButton>
    );
  }
);

Button.displayName = 'Button';

import { SxProps } from '@mui/material';
import Box, { BoxProps } from '@mui/material/Box';
import { FC, PropsWithChildren } from 'react';

type ContainerProps = BoxProps & {
  densed?: boolean;
  sxProps?: SxProps;
};

export const Container: FC<PropsWithChildren<ContainerProps>> = ({
  children,
  densed = false,
  sxProps = {},
  ...rest
}) => {
  return (
    <Box
      sx={{
        background: '#fff',
        boxSizing: 'border-box',
        boxShadow:
          '0px 3px 1px -2px #E9EBFA, 0px 2px 2px rgba(233, 235, 250, 0.5), 0px 1px 5px rgba(233, 235, 250, 0.2)',
        borderRadius: { xs: '8px', xl: '16px' },
        padding: densed
          ? { xs: '18px 24px', xl: '32px 40px' }
          : { xs: '24px 32px', xl: '48px 64px' },
        height: '100%',
        position: 'relative',
        ...sxProps,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
};

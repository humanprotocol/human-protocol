import { FC, ReactNode } from 'react';

import { Box, BoxProps } from '@mui/material';

type Props = BoxProps & {
  children: ReactNode;
};

const Container: FC<Props> = ({ children, ...props }) => {
  return (
    <Box mx="auto" px={{ xs: 3, sm: 5, lg: 7 }} {...props}>
      {children}
    </Box>
  );
};

export default Container;

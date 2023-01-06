import * as React from 'react';
import { Typography } from '@mui/material';

interface ICardTextBlock {
  children: React.ReactNode;
}
export const CardBlockWithChildren: React.FC<ICardTextBlock> = ({
  children,
}): React.ReactElement => (
  <Typography variant="body2" textAlign="center">
    {children}
  </Typography>
);

import * as React from 'react';
import { Box, CircularProgress, Divider, Typography } from '@mui/material';

interface ICardTextBlock {
  title?: string;
  value?: number | string;
}

export const CardTextBlock: React.FC<ICardTextBlock> = ({
  title = '',
  value,
}): React.ReactElement => (
  <>
    <Divider textAlign="center">
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
    </Divider>
    {value !== undefined ? (
      <Typography variant="body2" textAlign="center">
        {Number.isNaN(value) ? <>&nbsp;</> : value}
      </Typography>
    ) : (
      <Box display="flex" justifyContent="center">
        <CircularProgress size="1.5rem" />
      </Box>
    )}
  </>
);

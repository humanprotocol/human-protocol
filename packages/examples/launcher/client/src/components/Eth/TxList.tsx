import * as React from 'react';
import { Box, Typography } from '@mui/material';

export const TxList = ({ txs }: any) => {
  if (txs.length === 0) return null;

  return (
    <>
      {txs.map((item: any) => (
        <Box key={item}>
          <Box>
            <Typography>{item.hash}</Typography>
          </Box>
        </Box>
      ))}
    </>
  );
};

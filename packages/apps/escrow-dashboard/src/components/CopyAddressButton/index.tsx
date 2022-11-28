import { Box, IconButton, Typography } from '@mui/material';
import React from 'react';
import CopyLinkIcon from '../Icons/CopyLinkIcon';

type CopyAddressButtonProps = {
  address: string;
  [prop: string]: any;
};

export function CopyAddressButton({
  address,
  ...rest
}: CopyAddressButtonProps) {
  return (
    <Box
      display="flex"
      alignItems="center"
      sx={{
        background: '#fff',
        boxShadow:
          '0px 3px 1px -2px #E9EBFA, 0px 2px 2px rgba(233, 235, 250, 0.5), 0px 1px 5px rgba(233, 235, 250, 0.2)',
        borderRadius: '16px',
        px: 3,
        py: 1.5,
      }}
      {...rest}
    >
      <Typography
        color="primary"
        variant="body2"
        fontWeight={600}
        sx={{ mr: 3 }}
      >
        {address}
      </Typography>
      <IconButton color="primary">
        <CopyLinkIcon />
      </IconButton>
    </Box>
  );
}

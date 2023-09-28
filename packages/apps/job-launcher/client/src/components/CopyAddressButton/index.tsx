import { Box, IconButton, Typography } from '@mui/material';
import copy from 'copy-to-clipboard';
import { FC } from 'react';

import { CopyLinkIcon } from '../Icons/CopyLinkIcon';

type CopyAddressButtonProps = {
  address: string;
  [prop: string]: any;
};

export const CopyAddressButton: FC<CopyAddressButtonProps> = ({
  address,
  ...rest
}) => {
  const handleClickCopy = () => {
    copy(address);
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        background: '#fff',
        boxShadow:
          '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
        borderRadius: '4px',
        px: 2,
      }}
      {...rest}
    >
      <Typography
        color="primary"
        variant="body2"
        fontWeight={600}
        sx={{
          maxWidth: '376px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          mr: 4,
        }}
      >
        {address}
      </Typography>
      <IconButton color="primary" onClick={handleClickCopy}>
        <CopyLinkIcon />
      </IconButton>
    </Box>
  );
};

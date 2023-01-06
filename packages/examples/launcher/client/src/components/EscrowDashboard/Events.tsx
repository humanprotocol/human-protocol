import * as React from 'react';
import { Divider, Typography } from '@mui/material';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';

interface IEvents {
  url: string;
  scanner: string;
}

const Events: React.FC<IEvents> = ({ url, scanner }): React.ReactElement => {
  return (
    <Box textAlign="center">
      <Divider>
        <Typography variant="body2" color="text.secondary">
          All deployed escrows
        </Typography>
      </Divider>
      <Link href={url} target="_blank" rel="noopener noreferrer" align="center">
        {scanner}
      </Link>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          fontSize: 11,
        }}
      >
        Each event has a payload of ERC20 token address and Escrow Address
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          fontSize: 11,
        }}
      >
        Change the type of the second argument to "Address" to see an Escrow
        address
      </Typography>
    </Box>
  );
};

export default Events;

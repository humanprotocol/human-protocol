import { Box } from '@mui/material';
import * as React from 'react';
import { networks } from '../../constants/networkConstants';
import { Escrow } from './Escrow';

export const EscrowDashboard: React.FC = (): React.ReactElement => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-evenly',
        flexWrap: 'wrap',
      }}
    >
      {networks
        .filter((network) => !network.isDeprecated)
        .map((network) => (
          <Box mx={1} mb={2} key={network.key}>
            <Escrow network={network} />
          </Box>
        ))}
    </Box>
  );
};

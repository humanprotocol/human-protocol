import React from 'react';
import { Box, Chip, Typography, useTheme } from '@mui/material';
import { useAccount } from 'wagmi';
import { NetworkIcon } from './NetworkIcon';

const NetworkStatus: React.FC = () => {
  const { chain } = useAccount();
  const theme = useTheme();

  if (!chain) return null;

  return (
    <Chip
      avatar={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            svg: {
              width: 30,
              height: 30,
            },
          }}
        >
          <NetworkIcon chainId={chain.id} />
        </Box>
      }
      label={
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            color: theme.palette.primary.main,
            paddingLeft: 1,
          }}
        >
          {chain.name}
        </Typography>
      }
      sx={{
        backgroundColor: theme.palette.background.default,
        color: theme.palette.primary.contrastText,
        height: 64,
        paddingRight: 2,
        paddingLeft: 2,
        borderRadius: '12px',
      }}
    />
  );
};

export default NetworkStatus;

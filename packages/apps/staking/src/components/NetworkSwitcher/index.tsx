import { useState } from 'react';
import { Box, Button, Popover, MenuItem, Typography } from '@mui/material';
import { useAccount, useSwitchChain } from 'wagmi';
import { NETWORKS } from '@human-protocol/sdk';

import { SUPPORTED_CHAIN_IDS } from '../../constants/chains';
import { NetworkIcon } from '../NetworkStatus/NetworkIcon';
import { ChevronIcon, SuccessIcon } from '../../icons';

const NetworkSwitcher = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { switchChainAsync } = useSwitchChain();
  const { chain } = useAccount();

  const handleSwitchNetwork = async (chainId: number) => {
    try {
      await switchChainAsync?.({ chainId });
      setAnchorEl(null);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  return (
    <>
      <Button
        aria-describedby="network-popover"
        variant="text"
        disableRipple
        sx={{
          height: '100%',
          maxHeight: '42px',
          gap: '8px',
          color: 'text.primary',
          '&:hover': {
            bgcolor: 'inherit',
          },
        }}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <NetworkIcon chainId={chain?.id} />
        <ChevronIcon
          sx={{
            transform: anchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease-in-out',
          }}
        />
      </Button>
      <Popover
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: 'background.default',
            },
          },
        }}
      >
        {SUPPORTED_CHAIN_IDS.map((chainId) => (
          <MenuItem
            key={chainId}
            onClick={() => handleSwitchNetwork(chainId)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: '100%',
              minWidth: '350px',
              justifyContent: 'space-between',
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <NetworkIcon chainId={chainId} />
              <Typography>{NETWORKS[chainId]?.title}</Typography>
            </Box>
            {chain?.id === chainId && <SuccessIcon sx={{ ml: 1 }} />}
          </MenuItem>
        ))}
      </Popover>
    </>
  );
};

export default NetworkSwitcher;

import { useEffect } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import { NetworkIcon } from '@/shared/ui/NetworkIcon';
import { useIsMobile } from '@/utils/hooks/use-breakpoints';
import { useFilteredNetworks } from '@/utils/hooks/use-filtered-networks';
import { useLeaderboardSearch } from '@/utils/hooks/use-leaderboard-search';

export const SelectNetwork = () => {
  const {
    setChainId,
    filterParams: { chainId },
  } = useLeaderboardSearch();

  const { filteredNetworks, isLoading } = useFilteredNetworks();

  useEffect(() => {
    if (chainId === -1 && filteredNetworks.length > 0) {
      setChainId(filteredNetworks[0].id);
    }
  }, [chainId, filteredNetworks, setChainId]);

  const isMobile = useIsMobile();

  const handleChange = (event: SelectChangeEvent<number>) => {
    const value = Number(event.target.value);
    setChainId(value);
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="40px"
      >
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <FormControl
      fullWidth
      size="small"
      sx={{ width: isMobile ? '100%' : '210px', textTransform: 'none' }}
    >
      <InputLabel id="network-select-label">By Network</InputLabel>
      <Select<number>
        labelId="network-select-label"
        id="network-select"
        value={chainId === -1 ? '' : chainId}
        label="By Network"
        onChange={handleChange}
        sx={{
          '& #network-select svg': {
            display: 'none',
          },
        }}
      >
        {filteredNetworks.map((network) => (
          <MenuItem
            key={network.id}
            value={network.id}
            sx={{
              display: 'flex',
              gap: '10px',
            }}
          >
            <Box sx={{ svg: { width: '24px', height: '24px' } }}>
              <NetworkIcon chainId={network.id} />
            </Box>
            {network.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SelectNetwork;

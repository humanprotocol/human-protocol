import Select, { SelectChangeEvent } from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import { useLeaderboardSearch } from '@utils/hooks/use-leaderboard-search';
import { useFilteredNetworks } from '@utils/hooks/use-filtered-networks';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';
import { NetworkIcon } from '@components/NetworkIcon';
import CircularProgress from '@mui/material/CircularProgress';
import { useEffect } from 'react';

export const SelectNetwork = () => {
  const {
    setChainId,
    filterParams: { chainId },
  } = useLeaderboardSearch();

  const { filteredNetworks, isLoading } = useFilteredNetworks();
  const {
    mobile: { isMobile },
  } = useBreakPoints();

  // Filter out networks with id -1
  const validNetworks = filteredNetworks.filter(network => network.id !== -1);

  // Use 0 as the sentinel value for the unselected state
  const defaultChainId = validNetworks.length > 0 ? validNetworks[0].id : 0;

  useEffect(() => {
    if (validNetworks.length > 0 && (chainId === 0 || chainId === -1)) {
      setChainId(defaultChainId);
    }
  }, [validNetworks, chainId, defaultChainId, setChainId]);


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
        value={chainId !== -1 ? chainId : defaultChainId}
        label="By Network"
        onChange={handleChange}
      >
        {validNetworks.map((network) => (
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

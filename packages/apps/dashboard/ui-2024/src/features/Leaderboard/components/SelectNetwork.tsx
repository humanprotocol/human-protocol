import Select, { SelectChangeEvent } from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import HumanIcon from '@components/Icons/HumanIcon';
import { useLeaderboardSearch } from '@utils/hooks/use-leaderboard-search';
import { useFilteredNetworks } from '@utils/hooks/use-filtered-networks';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';
import { NetworkIcon } from '@components/NetworkIcon';
import CircularProgress from '@mui/material/CircularProgress';

export const SelectNetwork = () => {
  const {
    setChainId,
    filterParams: { chainId },
  } = useLeaderboardSearch();

  const { filteredNetworks, isLoading } = useFilteredNetworks();
  const {
    mobile: { isMobile },
  } = useBreakPoints();

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
        value={chainId}
        label="By Network"
        onChange={handleChange}
      >
        <MenuItem key="all-networks" className="select-item" value={-1}>
          <HumanIcon />
          All Networks
        </MenuItem>
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

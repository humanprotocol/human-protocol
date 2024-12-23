import Select, { SelectChangeEvent } from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import HumanIcon from '@components/Icons/HumanIcon';
import {
  leaderboardSearchSelectConfig,
  useLeaderboardSearch,
} from '@utils/hooks/use-leaderboard-search';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';
import { NetworkIcon } from '@components/NetworkIcon';

export const SelectNetwork = () => {
  const {
    setChainId,
    filterParams: { chainId },
  } = useLeaderboardSearch();

  const {
    mobile: { isMobile },
  } = useBreakPoints();

  const handleChange = (event: SelectChangeEvent<number>) => {
    const value = event.target.value;
    if (typeof value === 'number') {
      setChainId(value);
    }
  };

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
        {leaderboardSearchSelectConfig.map((selectItem) => {
          if ('allNetworksId' in selectItem) {
            return (
              <MenuItem
                key={selectItem.name}
                className="select-item"
                value={-1}
              >
                <HumanIcon />
                All Networks
              </MenuItem>
            );
          }

          return (
            <MenuItem
              key={selectItem.id}
              value={selectItem.id}
              sx={{
                display: 'flex',
                gap: '10px',
              }}
            >
              <Box sx={{ svg: { width: '24px', height: '24px' } }}>
                <NetworkIcon chainId={selectItem.id} />
              </Box>

              {selectItem.name}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};

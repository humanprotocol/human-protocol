import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React from 'react';
import { ESCROW_NETWORKS, SUPPORTED_CHAIN_IDS } from 'src/constants';

export const NetworkSelect = () => {
  return (
    <FormControl variant="standard" sx={{ m: 1, minWidth: 220 }}>
      <InputLabel id="newtork-select-label">Network</InputLabel>
      <Select
        labelId="network-select-label"
        id="network-select"
        label="Network"
      >
        {SUPPORTED_CHAIN_IDS.map((chainId) => (
          <MenuItem value={chainId} key={chainId}>
            {ESCROW_NETWORKS[chainId]?.title}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default NetworkSelect;

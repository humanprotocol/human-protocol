import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectProps,
} from '@mui/material';
import { FC } from 'react';

import { ESCROW_NETWORKS, SUPPORTED_CHAIN_IDS } from 'src/constants';

export const NetworkSelect: FC<SelectProps> = (props) => (
  <FormControl variant="standard" sx={{ m: 1, minWidth: 220 }}>
    <InputLabel id="newtork-select-label">Network</InputLabel>
    <Select
      labelId="network-select-label"
      id="network-select"
      label="Network"
      {...props}
    >
      {SUPPORTED_CHAIN_IDS.map((chainId) => (
        <MenuItem value={chainId} key={chainId}>
          {ESCROW_NETWORKS[chainId]?.title}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

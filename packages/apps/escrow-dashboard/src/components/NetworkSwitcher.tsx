import * as React from 'react';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { networks } from 'src/constants';

interface INetworkSwitcher {
  onNetworkChange: (value: string) => void;
  network: string;
}

const NetworkSwitcher: React.FC<INetworkSwitcher> = ({
  onNetworkChange,
  network,
}): React.ReactElement => (
  <Select
    id="network-select"
    value={network}
    size="small"
    sx={{ mt: 3 }}
    onChange={(event) => onNetworkChange(event.target.value)}
  >
    {networks.map((net) => (
      <MenuItem key={net.key} value={net.key}>
        {net.title}
      </MenuItem>
    ))}
  </Select>
);

export default NetworkSwitcher;

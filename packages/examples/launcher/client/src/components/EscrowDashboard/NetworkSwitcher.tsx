import * as React from 'react';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { networks } from '../../constants';

interface INetworkSwitcher {
  onNetworkChange: (value: string) => void;
  network: string;
}

export const NetworkSwitcher: React.FC<INetworkSwitcher> = ({
  onNetworkChange,
  network,
}): React.ReactElement => (
  <Select
    id="network-select"
    value={network}
    size="small"
    onChange={(event) => onNetworkChange(event.target.value)}
  >
    {networks.map((net: any) => (
      <MenuItem key={net.key} value={net.key}>
        {net.title}
      </MenuItem>
    ))}
  </Select>
);

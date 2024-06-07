import { ChainId, NETWORKS } from '@human-protocol/sdk';
import {
  FormControl,
  InputLabel,
  ListItemIcon,
  MenuItem,
  Select,
  SelectProps,
} from '@mui/material';
import { FC } from 'react';
import { CHAIN_ICONS } from '../Icons/chains';
import { V2_SUPPORTED_CHAIN_IDS } from 'src/constants';

type NetworkSelectProps = SelectProps & {
  showAllNetwork?: boolean;
  supportedChainIds?: ChainId[];
  width?: number | string;
};

export const NetworkSelect: FC<NetworkSelectProps> = (props) => (
  <FormControl
    variant="standard"
    sx={{ m: { xs: 0, md: 1 }, minWidth: 220, width: props.width }}
  >
    <InputLabel id="newtork-select-label">Network</InputLabel>
    <Select
      labelId="network-select-label"
      id="network-select"
      label="Network"
      sx={{
        '.MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          paddingTop: '8px',
          paddingBottom: '8px',
          minWidth: '300px',
          '.MuiListItemIcon-root': {
            minWidth: '36px',
          },
        },
      }}
      {...props}
    >
      {props.showAllNetwork && (
        <MenuItem value={ChainId.ALL}>
          <ListItemIcon sx={{ color: '#320a8d', fontSize: '0.8rem' }}>
            {CHAIN_ICONS[ChainId.ALL]}
          </ListItemIcon>
          All Networks
        </MenuItem>
      )}
      {(props.supportedChainIds ?? V2_SUPPORTED_CHAIN_IDS).map((chainId) => {
        const IconComponent = CHAIN_ICONS[chainId];
        return (
          <MenuItem value={chainId} key={chainId}>
            {IconComponent && (
              <ListItemIcon sx={{ color: '#320a8d' }}>
                {IconComponent}
              </ListItemIcon>
            )}
            {NETWORKS[chainId]?.title}
          </MenuItem>
        );
      })}
    </Select>
  </FormControl>
);

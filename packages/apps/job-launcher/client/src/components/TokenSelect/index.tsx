import {
  FormControl,
  InputLabel,
  ListItemIcon,
  MenuItem,
  Select,
  SelectProps,
} from '@mui/material';
import { FC } from 'react';
import { SUPPORTED_TOKENS } from '../../constants';

export const TokenSelect: FC<SelectProps> = (props) => (
  <FormControl fullWidth>
    <InputLabel id="token-select-label">Token</InputLabel>
    <Select
      labelId="token-select-label"
      id="token-select"
      label={props?.label ?? 'Token'}
      sx={{
        '.MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          minWidth: '300px',
          '.MuiListItemIcon-root': {
            minWidth: '36px',
          },
        },
      }}
      {...props}
    >
      {SUPPORTED_TOKENS.map((token) => {
        const IconComponent = token.icon;
        return (
          <MenuItem value={token.address} key={token.address}>
            {IconComponent && (
              <ListItemIcon sx={{ color: '#320a8d' }}>
                {IconComponent}
              </ListItemIcon>
            )}
            {token.symbol}
          </MenuItem>
        );
      })}
    </Select>
  </FormControl>
);

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
import { TOKEN_ICONS } from '../../components/Icons/chains';
import { SUPPORTED_TOKEN_SYMBOLS } from '../../constants';

type TokenSelectProps = SelectProps & {
  chainId: ChainId;
};

export const TokenSelect: FC<TokenSelectProps> = (props) => {
  return (
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
        {SUPPORTED_TOKEN_SYMBOLS.map((symbol) => {
          const IconComponent = TOKEN_ICONS[symbol];
          return (
            <MenuItem
              value={
                (NETWORKS[props.chainId] as any)[
                  symbol.toLowerCase() + 'Address'
                ]
              }
              key={symbol}
            >
              {IconComponent && (
                <ListItemIcon sx={{ color: '#320a8d' }}>
                  {IconComponent}
                </ListItemIcon>
              )}
              {symbol}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};

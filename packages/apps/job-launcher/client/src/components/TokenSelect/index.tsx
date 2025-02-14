import { ChainId } from '@human-protocol/sdk';
import {
  FormControl,
  InputLabel,
  ListItemIcon,
  MenuItem,
  Select,
  SelectProps,
} from '@mui/material';
import { FC, useMemo } from 'react';
import { TOKEN_ICONS } from '../../components/Icons/chains';
import { SUPPORTED_TOKEN_SYMBOLS } from '../../constants';
import { NETWORK_TOKENS } from '../../constants/chains';

type TokenSelectProps = SelectProps & {
  chainId: ChainId;
};

export const TokenSelect: FC<TokenSelectProps> = (props) => {
  const availableTokens = useMemo(() => {
    return SUPPORTED_TOKEN_SYMBOLS.filter(
      (symbol) =>
        NETWORK_TOKENS[props.chainId as keyof typeof NETWORK_TOKENS]?.[
          symbol.toLowerCase()
        ],
    );
  }, [props.chainId]);

  return (
    <FormControl fullWidth>
      <InputLabel id="token-select-label">Funding token</InputLabel>
      <Select
        labelId="token-select-label"
        id="token-select"
        label={props?.label ?? 'Funding token'}
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
        {availableTokens.map((symbol) => {
          const IconComponent = TOKEN_ICONS[symbol];
          return (
            <MenuItem value={symbol} key={symbol}>
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

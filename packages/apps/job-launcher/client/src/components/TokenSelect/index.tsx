import { ChainId } from '@human-protocol/sdk';
import {
  FormControl,
  InputLabel,
  ListItemIcon,
  MenuItem,
  Select,
  SelectProps,
} from '@mui/material';
import { FC, useEffect, useState } from 'react';
import { TOKEN_ICONS } from '../../components/Icons/chains';
import * as paymentService from '../../services/payment';

type TokenSelectProps = SelectProps & {
  chainId: ChainId;
  onTokenChange: (symbol: string, address: string) => void;
};

export const TokenSelect: FC<TokenSelectProps> = (props) => {
  const [availableTokens, setAvailableTokens] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    const fetchTokensData = async () => {
      const tokens = await paymentService.getTokensAvailable(props.chainId);
      setAvailableTokens(tokens);
    };

    fetchTokensData();
  }, [props.chainId]);

  return (
    <FormControl fullWidth>
      <InputLabel id="token-select-label">
        {props.label ?? 'Funding token'}
      </InputLabel>
      <Select
        labelId="token-select-label"
        id="token-select"
        label={props.label ?? 'Funding token'}
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
        onChange={(e) => {
          const symbol = e.target.value as string;
          const address = availableTokens[symbol];
          props.onTokenChange(symbol, address);
        }}
      >
        {Object.keys(availableTokens).map((symbol) => {
          const IconComponent = TOKEN_ICONS[symbol.toUpperCase()];
          return (
            <MenuItem value={symbol} key={symbol}>
              {IconComponent && (
                <ListItemIcon sx={{ color: '#320a8d' }}>
                  {IconComponent}
                </ListItemIcon>
              )}
              {symbol.toUpperCase()}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};

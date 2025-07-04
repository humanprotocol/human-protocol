import { FC, useCallback, useEffect, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import {
  InputAdornment,
  TextField,
  Select as MuiSelect,
  SelectChangeEvent,
  Grid,
  MenuItem,
  Box,
  CircularProgress,
  useTheme,
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

import useFilteredNetworks from '@/shared/api/useFilteredNetworks';
import { useIsMobile } from '@/shared/hooks/useBreakpoints';
import isValidEvmAddress from '@/shared/lib/isValidEvmAddress';
import useGlobalFiltersStore from '@/shared/store/useGlobalFiltersStore';
import CustomTooltip from '@/shared/ui/CustomTooltip';
import { NetworkIcon } from '@/shared/ui/NetworkIcon';

import {
  endAdornmentInputAdornmentSx,
  startAdornmentInputAdornmentSx,
  muiSelectSx,
  menuItemSx,
  muiTextFieldInputPropsSx,
  muiTextFieldSx,
  gridSx,
} from './styles';

type SearchBarProps = {
  className?: string;
  initialInputValue?: string;
};

const SearchBar: FC<SearchBarProps> = ({
  className = '',
  initialInputValue = '',
}) => {
  const isMobile = useIsMobile();
  const { filteredNetworks, isLoading } = useFilteredNetworks();
  const { address, chainId, setChainId, setAddress } = useGlobalFiltersStore();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState<string>(initialInputValue);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<boolean>(false);
  const theme = useTheme();

  useEffect(() => {
    setInputValue(address);
  }, [address]);

  useEffect(() => {
    if (!isLoading && filteredNetworks.length > 0 && chainId === -1) {
      setChainId(filteredNetworks[0].id);
    }
  }, [filteredNetworks, isLoading, chainId, setChainId]);

  const navigateToAddress = useCallback(() => {
    if (!isValidEvmAddress(inputValue)) {
      setError('Invalid EVM address.');
      return;
    }

    setAddress(inputValue);
    navigate(`/search/${chainId}/${inputValue}`);
  }, [inputValue, chainId, navigate, setAddress]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);

    if (isValidEvmAddress(value)) {
      setError(null);
    } else if (value.length > 0) {
      setError('Invalid EVM address. Must start with 0x and be 42 characters.');
    } else {
      setError(null);
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<number>) => {
    setChainId(Number(event.target.value));
  };

  const handleClearClick = () => {
    setInputValue('');
    setError(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateToAddress();
  };

  if (isLoading) return <CircularProgress />;

  const renderEmptyValue = (
    <Box component="span" color="text.secondary">
      Network
    </Box>
  );

  const renderSelectedValue = (
    <Grid sx={gridSx}>
      <NetworkIcon
        chainId={filteredNetworks.find((n) => n.id === chainId)?.id || -1}
      />
      <div>
        {isMobile || chainId === -1
          ? null
          : filteredNetworks.find((n) => n.id === chainId)?.name || ''}
      </div>
    </Grid>
  );

  return (
    <form className={clsx(`search ${className}`)} onSubmit={handleSubmit}>
      <TextField
        id="search-bar"
        placeholder="Search by Wallet/Escrow"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        error={!!error}
        helperText={error}
        fullWidth
        sx={muiTextFieldSx(isMobile)}
        InputProps={{
          sx: muiTextFieldInputPropsSx(
            theme,
            focus ? theme.palette.secondary.main : theme.palette.sky.dark
          ),
          startAdornment: (
            <InputAdornment
              position="start"
              sx={startAdornmentInputAdornmentSx(theme)}
            >
              <MuiSelect<number>
                value={chainId}
                displayEmpty
                sx={muiSelectSx(theme)}
                onChange={handleSelectChange}
                renderValue={() =>
                  chainId === -1 ? renderEmptyValue : renderSelectedValue
                }
              >
                {filteredNetworks.map((network) => (
                  <MenuItem
                    key={network.id}
                    value={network.id}
                    sx={menuItemSx(network.id === chainId)}
                  >
                    <Box sx={{ svg: { width: '24px', height: '24px' } }}>
                      <NetworkIcon chainId={network.id} />
                    </Box>
                    {network.name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </InputAdornment>
          ),
          endAdornment: inputValue && (
            <InputAdornment sx={endAdornmentInputAdornmentSx} position="end">
              <IconButton onClick={handleClearClick} edge="end">
                <CloseIcon
                  sx={{
                    color: focus ? 'sky.main' : 'primary.main',
                  }}
                />
              </IconButton>
              <CustomTooltip title={error || ''} arrow>
                <IconButton
                  type="submit"
                  aria-label="search"
                  sx={{
                    bgcolor: 'secondary.main',
                    borderRadius: '8px',
                    p: 0.5,
                    '&:hover': {
                      bgcolor: 'primary.main',
                    },
                  }}
                >
                  <SearchIcon
                    sx={{
                      fontSize: '32px',
                      color: error ? 'error.main' : 'white.main',
                    }}
                  />
                </IconButton>
              </CustomTooltip>
            </InputAdornment>
          ),
        }}
      />
    </form>
  );
};

export default SearchBar;

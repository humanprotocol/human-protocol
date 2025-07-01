import { FC, useCallback, useEffect, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import MuiSelect, { SelectChangeEvent } from '@mui/material/Select';
import useTheme from '@mui/material/styles/useTheme';
import TextField from '@mui/material/TextField';
import { useLocation, useNavigate } from 'react-router-dom';

import { ROUTES } from '@/app/config/routes';
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

const SearchBar: FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [focus, setFocus] = useState(false);
  const { filteredNetworks, isLoading } = useFilteredNetworks();
  const { address, chainId, setChainId, setAddress } = useGlobalFiltersStore();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const theme = useTheme();
  const location = useLocation();

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
      setError('');
    } else if (value.length > 0) {
      setError('Invalid EVM address. Must start with 0x and be 42 characters.');
    } else {
      setError('');
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<number>) => {
    setChainId(Number(event.target.value));
  };

  const handleClearClick = () => {
    setInputValue('');
    setError('');
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateToAddress();
  };

  if (isLoading) {
    const color =
      location.pathname === ROUTES.HOME ? 'white.main' : 'primary.main';
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="60px"
      >
        <CircularProgress sx={{ color }} />
      </Box>
    );
  }

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
    <form className="search" onSubmit={handleSubmit}>
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

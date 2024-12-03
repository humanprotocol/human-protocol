import { FC, useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import {
  InputAdornment,
  TextField,
  Select as MuiSelect,
  SelectChangeEvent,
  Grid,
  MenuItem,
  Box,
} from '@mui/material';
import { colorPalette } from '@assets/styles/color-palette';
import { getNetwork, networks } from '@utils/config/networks';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';
import { NetworkIcon } from '@components/NetworkIcon';
import { useWalletSearch } from '@utils/hooks/use-wallet-search';
import {
  endAdornmentInputAdornmentSx,
  startAdornmentInputAdornmentSx,
  muiSelectSx,
  menuItemSx,
  muiTextFieldInputPropsSx,
  muiTextFieldSx,
  gridSx,
} from './SearchBar.styles';

interface SearchBarProps {
  className?: string;
  displaySearchBar?: boolean;
  isTopBar?: boolean;
  initialInputValue?: string;
}

const SearchBar: FC<SearchBarProps> = ({
  className = '',
  displaySearchBar,
  initialInputValue = '',
  isTopBar = false,
}) => {
  const { mobile } = useBreakPoints();
  const [inputValue, setInputValue] = useState<string>(initialInputValue);
  const [selectValue, setSelectValue] = useState<number | null>(null);
  const [focus, setFocus] = useState<boolean>(false);
  const { filterParams, setAddress, setChainId } = useWalletSearch();
  const navigate = useNavigate();

  const navigateToAddress = useCallback(
    (chainIdParam?: number | undefined) => {
      const chainId = chainIdParam || filterParams.chainId || -1;
      const address = (isTopBar ? filterParams.address : inputValue) || '';
      navigate(`/search/${chainId}/${address}`);
    },
    [filterParams.address, filterParams.chainId, inputValue, isTopBar, navigate]
  );

  useEffect(() => {
    const networkName = getNetwork(filterParams.chainId || -1)?.name || '';
    if (networkName) {
      setSelectValue(filterParams.chainId);
    }
  }, [filterParams.chainId, navigateToAddress]);

  useEffect(() => {
    setInputValue(filterParams.address);
  }, [filterParams.address]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isTopBar) {
      setAddress(event.target.value);
    } else {
      setInputValue(event.target.value);
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<number | null>) => {
    const chainId = Number(event.target.value);
    if (inputValue && !!inputValue.length) {
      navigateToAddress(chainId);
    } else if (!inputValue.length && filterParams.address) {
      setInputValue(filterParams.address);
      setChainId(chainId);
    } else {
      setChainId(chainId);
    }
  };

  const handleClearClick = () => {
    setInputValue('');
    setAddress('');
    navigate('/');
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isTopBar) {
      setAddress(inputValue);
    }
    if (inputValue && !!inputValue.length) {
      navigateToAddress();
    }
  };

  const renderEmptyValue = (
    <span style={{ color: colorPalette.sky.main }}>Network</span>
  );

  const renderSelectedValue = (
    <Grid sx={gridSx}>
      <NetworkIcon
        chainId={networks.find((n) => n.id === selectValue)?.id || -1}
      />
      <div>
        {mobile.isMobile || !selectValue
          ? null
          : getNetwork(selectValue)?.name || ''}
      </div>
    </Grid>
  );

  return (
    <form
      className={clsx(
        `search ${displaySearchBar ? 'search-white' : ''} ${className}`
      )}
      onSubmit={handleSubmit}
    >
      <TextField
        id="search-bar"
        placeholder="Search by Wallet/Escrow"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        fullWidth
        sx={muiTextFieldSx(mobile)}
        InputProps={{
          sx: muiTextFieldInputPropsSx(
            focus ? colorPalette.secondary.main : colorPalette.skyOpacity
          ),
          startAdornment: (
            <InputAdornment
              position="start"
              sx={startAdornmentInputAdornmentSx}
            >
              <MuiSelect<number | null>
                value={selectValue}
                displayEmpty
                sx={muiSelectSx(isTopBar, mobile)}
                onChange={handleSelectChange}
                renderValue={() =>
                  selectValue === null ? renderEmptyValue : renderSelectedValue
                }
              >
                {networks.map((network) => (
                  <MenuItem
                    key={network.id}
                    value={network.id}
                    sx={menuItemSx(network.id === selectValue)}
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
                  style={{
                    color: focus
                      ? colorPalette.textSecondary.main
                      : colorPalette.primary.main,
                  }}
                />
              </IconButton>
              <IconButton
                className="search-button"
                type="submit"
                aria-label="search"
                disabled={!inputValue.length}
                sx={{
                  [mobile.mediaQuery]: {
                    padding: '4px',
                  },
                }}
              >
                <SearchIcon
                  style={{
                    color: displaySearchBar
                      ? colorPalette.textSecondary.main
                      : colorPalette.white,
                  }}
                />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </form>
  );
};

export default SearchBar;

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
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { colorPalette } from '@assets/styles/color-palette';
import { useFilteredNetworks } from '@utils/hooks/use-filtered-networks';
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
import { isValidEVMAddress } from '../../helpers/isValidEVMAddress';

interface SearchBarProps {
  className?: string;
  initialInputValue?: string;
}

const SearchBar: FC<SearchBarProps> = ({
  className = '',
  initialInputValue = '',
}) => {
  const { mobile } = useBreakPoints();
  const { filteredNetworks, isLoading } = useFilteredNetworks();
  const { filterParams, setChainId, setAddress } = useWalletSearch();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState<string>(initialInputValue);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<boolean>(false);

  useEffect(() => {
    setInputValue(filterParams.address);
  }, [filterParams.address]);

  useEffect(() => {
    if (
      !isLoading &&
      filteredNetworks.length > 0 &&
      filterParams.chainId === -1
    ) {
      setChainId(filteredNetworks[0].id);
    }
  }, [filteredNetworks, isLoading, filterParams.chainId, setChainId]);

  const navigateToAddress = useCallback(() => {
    if (!isValidEVMAddress(inputValue)) {
      setError('Invalid EVM address.');
      return;
    }

    setAddress(inputValue);
    navigate(`/search/${filterParams.chainId}/${inputValue}`);
  }, [inputValue, filterParams.chainId, navigate, setAddress]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);

    if (isValidEVMAddress(value)) {
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
    <span style={{ color: colorPalette.sky.main }}>Network</span>
  );

  const renderSelectedValue = (
    <Grid sx={gridSx}>
      <NetworkIcon
        chainId={
          filteredNetworks.find((n) => n.id === filterParams.chainId)?.id || -1
        }
      />
      <div>
        {mobile.isMobile || filterParams.chainId === -1
          ? null
          : filteredNetworks.find((n) => n.id === filterParams.chainId)?.name ||
            ''}
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
              <MuiSelect<number>
                value={filterParams.chainId}
                displayEmpty
                sx={muiSelectSx(mobile)}
                onChange={handleSelectChange}
                renderValue={() =>
                  filterParams.chainId === -1
                    ? renderEmptyValue
                    : renderSelectedValue
                }
              >
                {filteredNetworks.map((network) => (
                  <MenuItem
                    key={network.id}
                    value={network.id}
                    sx={menuItemSx(network.id === filterParams.chainId)}
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
              <Tooltip title={error || ''} arrow enterTouchDelay={0}>
                <IconButton
                  className="search-button"
                  type="submit"
                  aria-label="search"
                  sx={{
                    [mobile.mediaQuery]: {
                      padding: '4px',
                    },
                  }}
                >
                  <SearchIcon
                    style={{
                      color: error
                        ? colorPalette.error.main
                        : colorPalette.white,
                    }}
                  />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        }}
      />
    </form>
  );
};

export default SearchBar;

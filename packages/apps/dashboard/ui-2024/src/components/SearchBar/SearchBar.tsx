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
  const [inputValue, setInputValue] = useState<string>(initialInputValue);
  const [selectValue, setSelectValue] = useState<number | string>('');
  const [focus, setFocus] = useState<boolean>(false);
  const { filterParams } = useWalletSearch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const navigateToAddress = useCallback(
    (chainIdParam?: number | undefined) => {
      const chainId = chainIdParam || selectValue || -1;
      const address = inputValue || '';
      navigate(`/search/${chainId}/${address}`);
    },
    [inputValue, selectValue, navigate]
  );

  useEffect(() => {
    const networkName = getNetwork(filterParams.chainId || -1)?.name || '';
    if (networkName) {
      setSelectValue(filterParams.chainId);
    }
  }, [filterParams.chainId]);

  useEffect(() => {
    setInputValue(filterParams.address);
  }, [filterParams.address]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);

    if (isValidEVMAddress(value)) {
      setError(null);
    } else if (value.length > 0) {
      setError('Invalid EVM address. Must start with 0x and be 42 characters.');
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<number | string>) => {
    const chainId = Number(event.target.value);
    setSelectValue(chainId);
  };

  const handleClearClick = () => {
    setInputValue('');
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValidEVMAddress(inputValue)) {
      return;
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
          : getNetwork(Number(selectValue))?.name || ''}
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
              <MuiSelect<number | string>
                value={selectValue}
                displayEmpty
                sx={muiSelectSx(mobile)}
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

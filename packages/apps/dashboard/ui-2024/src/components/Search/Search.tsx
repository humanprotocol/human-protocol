import { FC, useEffect, useState } from 'react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import {
  InputAdornment,
  TextField,
  MenuItem,
  Select as MuiSelect,
  SelectChangeEvent,
  Grid,
} from '@mui/material';
import { colorPalette } from '@assets/styles/color-palette';
import { getNetwork, networks } from '@utils/config/networks';
import { useWalletSearch } from '@utils/hooks/use-wallet-search';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';
import { NetworkIcon } from '@components/NetworkIcon';

const Search: FC<{
  className?: string;
  displaySearchBar?: boolean;
  borderColor?: string;
}> = ({
  className,
  displaySearchBar,
  borderColor = colorPalette.secondary.main,
}) => {
  const { mobile } = useBreakPoints();
  const { filterParams, setAddress, setChainId } = useWalletSearch();
  const [inputValue, setInputValue] = useState<string>('');
  const [selectValue, setSelectValue] = useState<string>('');
  const [focus, setFocus] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const chainId = Number(event.target.value);
    setChainId(chainId);
    const networkName = getNetwork(chainId)?.name || '';
    setSelectValue(networkName);
  };

  const handleClearClick = () => {
    setInputValue('');
    setAddress('');
  };

  const handleInputBlur = () => {
    setFocus(false);
  };

  const handleInputFocus = () => {
    setFocus(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddress(inputValue);
    navigate(`/search/${filterParams.chainId || -1}/${inputValue || '0x0'}`);
  };

  useEffect(() => {
    const networkName = getNetwork(filterParams.chainId || -1)?.name || '';
    if (networkName) {
      setSelectValue(networkName);
    }
  }, [filterParams.chainId]);

  useEffect(() => {
    setInputValue(filterParams.address);
  }, [filterParams.address]);

  return (
    <form
      className={clsx('search', className, {
        'search-white': displaySearchBar,
      })}
      onSubmit={handleSubmit}
    >
      <TextField
        id="search-bar"
        placeholder="Search by Wallet/Escrow"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        fullWidth
        sx={{
          fontSize: '16px',
          '& .MuiOutlinedInput-root': {
            '& input': {
              [mobile.mediaQuery]: {
                padding: '12px 0px',
              },
            },
            '& fieldset': {
              border: 'none',
            },
          },
          '& .MuiInputBase-input': {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
        }}
        InputProps={{
          sx: {
            width: '100%',
            height: '100%',
            borderRadius: '10px',
            border: `1px solid ${borderColor}`,
            backgroundColor: `${colorPalette.white}`,
            fontSize: 'inherit',
            'input::placeholder': {
              color: `${colorPalette.sky.main}`,
              opacity: 1,
            },
            padding: '0 5px',
          },
          startAdornment: (
            <InputAdornment
              position="start"
              sx={{
                height: '100%',
                backgroundColor: `${colorPalette.white}`,
                marginLeft: '1rem',
              }}
            >
              <MuiSelect
                value={selectValue}
                displayEmpty
                sx={{
                  backgroundColor: `${colorPalette.white}`,
                  width: '220px',
                  fontSize: '16px',
                  boxShadow: 'none',
                  outline: 'none',
                  '& .MuiOutlinedInput-notchedOutline': { border: 0 },
                  '& .MuiSelect-select': {
                    padding: 0,
                    paddingRight: '24px',
                    backgroundColor: `${colorPalette.white}`,
                    border: 0,
                  },
                  '& .MuiInputBase-input': {
                    backgroundColor: `${colorPalette.white}`,
                  },
                  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                    {
                      border: 0,
                      outline: 'none',
                    },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                    {
                      border: 0,
                      outline: 'none',
                    },
                  [mobile.mediaQuery]: {
                    width: 'unset',
                  },
                }}
                onChange={handleSelectChange}
                renderValue={
                  selectValue === ''
                    ? () => (
                        <span style={{ color: colorPalette.sky.main }}>
                          Network
                        </span>
                      )
                    : () => {
                        return (
                          <Grid
                            sx={{
                              display: 'flex',
                              justifyContent: 'flex-start',
                              alignItems: 'center',
                              gap: '8px',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                            }}
                          >
                            <NetworkIcon chainId={filterParams.chainId} />
                            <div>
                              {mobile.isMobile
                                ? null
                                : getNetwork(filterParams.chainId)?.name}
                            </div>
                          </Grid>
                        );
                      }
                }
              >
                {networks.map((network) => (
                  <MenuItem key={network.name} value={network.id}>
                    <Grid
                      sx={{
                        display: 'flex',
                        gap: '8px',
                        svg: { width: '24px', height: '24px' },
                      }}
                    >
                      <NetworkIcon chainId={network.id} /> {network.name}
                    </Grid>
                  </MenuItem>
                ))}
              </MuiSelect>
            </InputAdornment>
          ),
          endAdornment: inputValue && (
            <InputAdornment
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.7rem',
              }}
              position="end"
            >
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

export default Search;

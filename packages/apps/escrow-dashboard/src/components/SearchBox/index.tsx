import * as React from 'react';
import SearchIcon from '@mui/icons-material/Search';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Button, TextField } from '@mui/material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

const SearchBox: React.FC = (): React.ReactElement => {
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box display="flex" alignItems="center" position="relative" width="100%">
      <>
        <Button
          variant="contained"
          color="inherit"
          onClick={handleClick}
          sx={{
            backgroundColor: '#e9e9f8',
            boxShadow:
              '0px 7px 8px -4px #E9EBFA, 0px 13px 19px 2px rgba(233, 235, 250, 0.5), 0px 5px 24px 4px rgba(233, 235, 250, 0.2)',
            color: theme.palette.primary.main,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            borderTopLeftRadius: 6,
            borderBottomLeftRadius: 6,
          }}
          endIcon={<ArrowDropUpIcon />}
        >
          Filters
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'basic-button',
          }}
        >
          <MenuItem onClick={handleClose}>All</MenuItem>
          <MenuItem onClick={handleClose}>Escrows</MenuItem>
          <MenuItem onClick={handleClose}>Stakers</MenuItem>
        </Menu>
      </>
      <TextField
        fullWidth
        variant="filled"
        InputProps={{
          sx: {
            borderTopRightRadius: 6,
            borderBottomRightRadius: 6,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            '&:after': {
              display: 'none',
            },
            '&:before': {
              display: 'none',
            },
          },
        }}
        inputProps={{
          sx: {
            padding: '7px 26px',
            background: '#f5f7fe',
            borderTopRightRadius: 6,
            borderBottomRightRadius: 6,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
          },
        }}
        placeholder="Search by Escrow/Staker"
      />
      <SearchIcon
        color="primary"
        sx={{ position: 'absolute', right: '6px', top: '6px' }}
      />
    </Box>
  );
};

export default SearchBox;

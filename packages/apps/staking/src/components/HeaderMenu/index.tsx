import { FC, useState } from 'react';

import { Box, Button, Link, Popover, styled } from '@mui/material';

import { ChevronIcon } from '../../icons';
import { ROUTES } from '../../constants';

const NavLink = styled(Link)(({ theme }) => {
  const { isDarkMode, palette } = theme;
  const color = isDarkMode ? palette.text.primary : palette.primary.main;

  return {
    color,
    padding: '6px 8px',
    fontSize: '14px',
    lineHeight: '150%',
    letterSpacing: '0.1px',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',

    '&:visited, &:hover': {
      color,
    },

    '@media (min-width: 900px) and (max-width: 1200px)': {
      padding: '6px 4px',
      fontSize: '12px',
    },
  };
});

const PopoverArrow = () => (
  <Box
    sx={{
      position: 'absolute',
      top: -7,
      left: 'calc(50% - 7px)',
      width: 14,
      height: 14,
      bgcolor: 'white.main',
      borderLeft: '1px solid rgba(218, 220, 232, 0.70)',
      borderTop: '1px solid rgba(218, 220, 232, 0.70)',
      transform: 'rotate(45deg)',
      zIndex: 0,
    }}
  />
);

const HeaderMenu: FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const open = !!anchorEl;

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Button
        variant="text"
        size="medium"
        aria-describedby={open ? 'header-menu' : undefined}
        sx={{ height: '42px' }}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        HUMAN Protocol
        <ChevronIcon
          sx={{
            ml: 0.5,
            transform: anchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease-in-out',
          }}
        />
      </Button>
      <Popover
        id="header-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              borderRadius: '12px',
              border: '1px solid rgba(218, 220, 232, 0.70)',
              mt: 1,
              overflow: 'visible',
            },
          },
        }}
      >
        <PopoverArrow />
        <Box display="flex" flexDirection="column" p={2.5} gap={0.5} zIndex={1}>
          <NavLink href="https://humanprotocol.org" target="_blank">
            Human Website
          </NavLink>
          <NavLink
            href={import.meta.env.VITE_HEADER_LINK_DASHBOARD}
            target="_blank"
          >
            Dashboard
          </NavLink>
          <NavLink href={ROUTES.KVSTORE}>KV Store</NavLink>
          <NavLink href={ROUTES.DASHBOARD}>Staking Overview</NavLink>
        </Box>
      </Popover>
    </>
  );
};

export default HeaderMenu;

import { FC, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as MuiLink } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import styled from '@mui/material/styles/styled';
import Toolbar from '@mui/material/Toolbar';
import { Link } from 'react-router-dom';

import { env } from '@/shared/lib/env';
import LogoBlockIcon from '@/shared/ui/icons/LogoBlockIcon';
import LogoBlockIconMobile from '@/shared/ui/icons/LogoBlockIconMobile';

const NavLink = styled(MuiLink)(({ theme }) => ({
  color: theme.palette.primary.main,
  padding: '6px 8px',
  fontSize: '14px',
  fontWeight: 600,
  lineHeight: '150%',
  cursor: 'pointer',
  textDecoration: 'none',
  width: 'fit-content',
}));

const Header: FC = () => {
  const [open, setState] = useState(false);

  const handleClick = (url: string) => {
    window.open(url, '_blank');
  };

  const toggleDrawer = (open: boolean) => {
    setState(open);
  };

  return (
    <AppBar
      position="static"
      sx={{
        bgcolor: 'white.main',
        boxShadow: 'none',
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          px: { xs: 4, md: 0 },
          height: { xs: 62, md: 82 },
        }}
      >
        <Link to="/">
          <LogoBlockIcon sx={{ display: { xs: 'none', md: 'block' } }} />
          <LogoBlockIconMobile sx={{ display: { xs: 'block', md: 'none' } }} />
        </Link>

        <Box
          display={{ xs: 'none', md: 'flex' }}
          alignItems="center"
          height="100%"
          p={1}
          gap={2}
        >
          <NavLink href={env.VITE_NAVBAR_LINK_GITBOOK}>GitBook</NavLink>
          <NavLink href={env.VITE_NAVBAR_LINK_FAUCETS}>Faucet</NavLink>
          <NavLink href={env.VITE_NAVBAR_LINK_HUMAN_WEBSITE}>
            HUMAN Website
          </NavLink>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleClick(env.VITE_NAVBAR_LINK_LAUNCH_JOBS)}
          >
            Launch Jobs
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => handleClick(env.VITE_NAVBAR_LINK_WORK_AND_EARN)}
          >
            Work & Earn
          </Button>
        </Box>

        <IconButton
          edge="start"
          color="inherit"
          aria-label="open drawer"
          sx={{ display: { xs: 'flex', md: 'none' } }}
          onClick={() => toggleDrawer(true)}
        >
          <MenuIcon />
        </IconButton>

        <Drawer
          anchor="right"
          variant="temporary"
          open={open}
          onClose={() => toggleDrawer(false)}
          PaperProps={{
            sx: {
              width: '80%',
            },
          }}
        >
          <Box py={3} px={2}>
            <Box display="flex" justifyContent="flex-end">
              <CloseIcon onClick={() => toggleDrawer(false)} />
            </Box>

            <Box display="flex" flexDirection="column" gap={2}>
              <NavLink href={env.VITE_NAVBAR_LINK_GITBOOK}>GitBook</NavLink>
              <NavLink href={env.VITE_NAVBAR_LINK_FAUCETS}>Faucet</NavLink>
              <NavLink href={env.VITE_NAVBAR_LINK_HUMAN_WEBSITE}>
                HUMAN Website
              </NavLink>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleClick(env.VITE_NAVBAR_LINK_LAUNCH_JOBS)}
              >
                Launch Jobs
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => handleClick(env.VITE_NAVBAR_LINK_WORK_AND_EARN)}
              >
                Work & Earn
              </Button>
            </Box>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

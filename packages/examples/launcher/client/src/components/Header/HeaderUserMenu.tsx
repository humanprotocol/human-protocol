import * as React from 'react';
import { AppBar, Box, IconButton, Toolbar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// icons
import { RiMenu3Line } from 'react-icons/ri';
// import { BiSearch } from 'react-icons/bi';
import { useSelector } from 'react-redux';
import AccountMenu from './AccountMenu';
import { makeIsTokenAuthenticated } from '../../services/redux/selectors/auth';
import { drawerWidth } from '../Layouts/DashboardLayout';

const AppBarStyle = styled(AppBar)(({ theme }: any) => ({
  boxShadow: 'none',
  backdropFilter: 'blur(6px)',
  backgroundColor: 'rgba(255, 255, 255, 0.72)',
  color: '#333333',
  [theme.breakpoints.up('sm')]: {
    width: `calc(100% - ${drawerWidth}px)`,
    flexShrink: 0,
  },
}));

const ToolbarStyle = styled(Toolbar)(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignContent: 'flex-start',
  alignItems: 'center',
}));

const ContainerStyle = styled(Box)(({ theme }: any) => ({
  display: 'grid',
  gap: theme.spacing(0.5),
  gridAutoFlow: 'column',
  alignItems: 'center',
}));

const ToggleButtonStyle = styled(IconButton)(({ theme }: any) => ({
  [theme.breakpoints.up('sm')]: {
    display: 'none',
  },
}));

const HeaderUserMenu = ({ onClick }: any) => {
  const isAuth = useSelector(makeIsTokenAuthenticated);

  return (
    <AppBarStyle position="fixed">
      <ToolbarStyle>
        <ContainerStyle>
          <ToggleButtonStyle
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onClick}
          >
            <RiMenu3Line />
          </ToggleButtonStyle>

          {/* <IconButton aria-label="search">
            <BiSearch fontSize="small" />
          </IconButton> */}
        </ContainerStyle>
        {isAuth && (
          <ContainerStyle>
            <ConnectButton />
            <AccountMenu />
          </ContainerStyle>
        )}
      </ToolbarStyle>
    </AppBarStyle>
  );
};

export default HeaderUserMenu;

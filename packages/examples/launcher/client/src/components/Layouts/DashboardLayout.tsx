import { Box, styled, Toolbar, CssBaseline } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useState } from 'react';
import SideDrawer from './SideDrawer';
import HeaderUserMenu from '../Header/HeaderUserMenu';

export const drawerWidth = 240;

const useStyles = makeStyles({
  drawerPaper: {
    width: drawerWidth,
    display: 'grid',
    gridTemplateRows: 'auto auto 1fr auto',
  },
});

const MainStyle = styled('main')(({ theme }) => ({
  flexGrow: 1,
  minHeight: '100vh',
  padding: theme.spacing(2.5),
}));

export const DashboardLayout = ({ children, window }: any) => {
  const [toggleMenu, setToggleMenu] = useState(false);
  const classes = useStyles();

  const handleToggleDrawer = () => setToggleMenu(!toggleMenu);
  const handleToggleClose = () => setToggleMenu(false);

  const container =
    window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <HeaderUserMenu onClick={handleToggleDrawer} />
      <SideDrawer
        container={container}
        toggleMenu={toggleMenu}
        onClose={handleToggleClose}
        drawerPaper={classes.drawerPaper}
      />

      <MainStyle>
        <Toolbar />
        {children}
      </MainStyle>
    </Box>
  );
};

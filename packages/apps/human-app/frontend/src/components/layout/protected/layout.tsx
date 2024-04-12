import { Grid } from '@mui/material';
import { useState } from 'react';
import { styled } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { breakpoints } from '@/styles/theme';
import { Footer } from '../footer';
import { DrawerNavigation } from './drawer-navigation';
import { Navbar } from './navbar';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
  isMobile?: boolean;
}>(({ theme, open, isMobile }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: 0,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: isMobile ? 0 : `${drawerWidth}px`,
  }),
}));

export function Layout() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(!isMobile);
  return (
    <Grid
      alignItems="center"
      container
      direction="column"
      flexWrap="nowrap"
      justifyContent="space-between"
      sx={{
        height: '100vh',
        width: '100%',
        px: '44px',
        pb: '44px',
        pt: isMobile ? '32px' : '44px',
        [breakpoints.mobile]: {
          px: '10px',
        },
      }}
    >
      <Navbar open={open} setOpen={setOpen} />
      <DrawerNavigation drawerWidth={drawerWidth} open={open} />
      <Main isMobile={isMobile} open={open}>
        <Outlet />
      </Main>
      <Footer />
    </Grid>
  );
}

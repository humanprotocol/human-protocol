import { Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { breakpoints } from '@/styles/theme';
import { Footer } from '../footer';
import { DrawerNavigation } from './drawer-navigation';
import { Navbar } from './navbar';

export const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
  isMobile?: boolean;
}>(({ theme, open, isMobile }) => ({
  width: '100%',
  flexGrow: 1,
  flexDirection: 'column',
  justifyContent: 'space-between',
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    paddingLeft: isMobile ? 0 : `${drawerWidth}px`,
  }),
}));

export function Layout() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(!isMobile);

  useEffect(() => {
    if (!isMobile) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [isMobile]);

  return (
    <Grid
      alignItems="center"
      container
      direction="column"
      flexWrap="nowrap"
      justifyContent="space-between"
      sx={{
        width: '100%',
        height: '100vh',
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
      <Footer marginLeft={isMobile ? '0' : `${drawerWidth}px`} />
    </Grid>
  );
}

import { Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useBackgroundColorStore } from '@/hooks/use-background-store';
import { colorPalette } from '@/styles/color-palette';
import { AvaibleJobsDrawerMobile } from '@/pages/worker/jobs/components/avaible-jobs/available-jobs-drawer-mobile';
import { useMobileDrawerFilterStore } from '@/hooks/use-mobile-drawer-filter-store';
import { Footer } from '../footer';
import { DrawerNavigation } from './drawer-navigation';
import { Navbar } from './navbar';

const drawerWidth = 240;

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
    paddingLeft: isMobile ? 0 : `140px`,
  }),
}));

export function Layout() {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const { backgroundColor } = useBackgroundColorStore();
  const { isMobileFilterDrawerOpen } = useMobileDrawerFilterStore();

  useEffect(() => {
    if (isMobile) {
      setDrawerOpen(false);
    } else {
      setDrawerOpen(true);
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
        height: '100%',
        minHeight: '100vh',
        width: '100%',
        pt: '0',
        pl: isMobile ? 0 : '120px',
        pr: isMobile ? 0 : '20px',
        backgroundColor: isMobile ? colorPalette.white : backgroundColor,
      }}
    >
      <Navbar
        open={drawerOpen || isMobileFilterDrawerOpen}
        setOpen={setDrawerOpen}
      />
      <DrawerNavigation drawerWidth={drawerWidth} open={drawerOpen} />
      <AvaibleJobsDrawerMobile
        drawerWidth={drawerWidth}
        open={isMobileFilterDrawerOpen}
      />
      <Main isMobile={isMobile} open={drawerOpen}>
        <Outlet />
      </Main>
      <Footer isProtected />
    </Grid>
  );
}

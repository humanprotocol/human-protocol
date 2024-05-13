import { Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useBackgroundColorStore } from '@/hooks/use-background-store';
import type { PageHeaderProps } from '@/components/layout/protected/page-header';
import { PageHeader } from '@/components/layout/protected/page-header';
import { breakpoints } from '@/styles/theme';
import { TopNotification } from '@/components/ui/top-notofication';
import { Footer } from '../footer';
import { DrawerNavigation } from './drawer-navigation';
import { Navbar } from './navbar';

const drawerWidth = 240;

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isMobile',
})<{
  open?: boolean;
  isMobile?: boolean;
}>(({ theme, open, isMobile }) => ({
  width: '100%',
  flex: '1',
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

export function Layout({
  pageHeaderProps,
}: {
  pageHeaderProps: PageHeaderProps;
}) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const { backgroundColor } = useBackgroundColorStore();

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
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        height: '100%',
        width: '100%',
        pt: '0',
        pl: isMobile ? 0 : '120px',
        pr: isMobile ? 0 : '20px',
        backgroundColor,
      }}
    >
      <Navbar open={drawerOpen} setOpen={setDrawerOpen} />
      <DrawerNavigation drawerWidth={drawerWidth} open={drawerOpen} />
      <Main isMobile={isMobile} open={drawerOpen}>
        <Grid
          container
          sx={{
            margin: '1rem 0',
            display: 'flex',
            gap: '2rem',
            flexDirection: 'column',
            padding: '0 2rem',
            [breakpoints.mobile]: {
              gap: '1rem',
              padding: '0 1rem',
            },
          }}
        >
          <Grid item minHeight="3rem">
            <TopNotification type="warning">test</TopNotification>
          </Grid>

          <Grid item>
            <PageHeader {...pageHeaderProps} />
          </Grid>
          <Outlet />
        </Grid>
      </Main>
      <Footer isProtected />
    </Grid>
  );
}

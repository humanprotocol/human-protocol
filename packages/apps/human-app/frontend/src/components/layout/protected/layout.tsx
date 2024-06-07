import { Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useBackgroundColorStore } from '@/hooks/use-background-store';
import type { PageHeaderProps } from '@/components/layout/protected/page-header';
import { PageHeader } from '@/components/layout/protected/page-header';
import { breakpoints } from '@/styles/theme';
import { TopNotification } from '@/components/ui/top-notification';
import type { TopNotificationPayload } from '@/components/layout/protected/layout-notification-context';
import { ProtectedLayoutContext } from '@/components/layout/protected/layout-notification-context';
import { Footer } from '../footer';
import { Navbar } from './navbar';

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isMobile',
})<{
  open?: boolean;
  isMobile?: boolean;
}>(({ theme, open, isMobile }) => ({
  width: '100%',
  display: 'flex',
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
  renderDrawer,
}: {
  pageHeaderProps: PageHeaderProps;
  renderDrawer: (open: boolean) => JSX.Element;
}) {
  const [notification, setNotification] =
    useState<TopNotificationPayload | null>(null);
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
    <ProtectedLayoutContext.Provider
      value={{
        setTopNotification: (data) => {
          setNotification(data);
        },
        closeNotification: () => {
          setNotification(null);
        },
      }}
    >
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
        {renderDrawer(drawerOpen)}
        <Main isMobile={isMobile} open={drawerOpen}>
          <Grid
            container
            sx={{
              margin: '1rem 0',
              display: 'flex',
              gap: '2rem',
              flexDirection: 'column',
              padding: '0 2rem',
              flexWrap: 'nowrap',
              [breakpoints.mobile]: {
                gap: '1rem',
                padding: '0 1rem',
              },
            }}
          >
            <Grid
              item
              sx={{
                minHeight: '3.2rem',
                [breakpoints.mobile]: {
                  minHeight: 'unset',
                },
              }}
            >
              {notification ? (
                <TopNotification
                  onClose={() => {
                    setNotification(null);
                  }}
                  type={notification.type}
                >
                  {notification.content}
                </TopNotification>
              ) : null}
            </Grid>

            <Grid item>
              <PageHeader {...pageHeaderProps} />
            </Grid>
            <Grid sx={{ height: '100%' }}>
              <Outlet />
            </Grid>
          </Grid>
        </Main>
        <Footer isProtected />
      </Grid>
    </ProtectedLayoutContext.Provider>
  );
}

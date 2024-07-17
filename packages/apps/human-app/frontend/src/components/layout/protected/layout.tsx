import { Grid } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef, useState } from 'react';
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
import { useIsHCaptchaLabelingPage } from '@/hooks/use-is-hcaptcha-labeling-page';
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
  renderHCaptchaStatisticsDrawer,
}: {
  pageHeaderProps: PageHeaderProps;
  renderDrawer: (
    open: boolean,
    setDrawerOpen: Dispatch<SetStateAction<boolean>>
  ) => JSX.Element;
  renderHCaptchaStatisticsDrawer?: (isOpen: boolean) => JSX.Element;
}) {
  const [notificationWith, setNotificationWith] = useState<
    number | undefined
  >();
  const layoutElementRef = useRef<HTMLDivElement>();
  const isHCaptchaLabelingPage = useIsHCaptchaLabelingPage();
  const [notification, setNotification] =
    useState<TopNotificationPayload | null>(null);
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [hcaptchaDrawerOpen, setHcaptchaDrawerOpen] = useState(false);
  const { backgroundColor } = useBackgroundColorStore();
  const toggleUserStatsDrawer = isHCaptchaLabelingPage
    ? () => {
        setHcaptchaDrawerOpen((state) => !state);
      }
    : undefined;

  useEffect(() => {
    if (isMobile) {
      setHcaptchaDrawerOpen(false);
      setDrawerOpen(false);
    } else {
      setHcaptchaDrawerOpen(false);
      setDrawerOpen(true);
    }
  }, [isMobile]);

  const setNotificationWidth = () => {
    if (layoutElementRef.current) {
      setNotificationWith(layoutElementRef.current.clientWidth);
    }
  };
  useEffect(() => {
    setNotificationWidth();
    window.addEventListener('resize', () => {
      setNotificationWidth();
    });
    return () => {
      window.removeEventListener('resize', setNotificationWidth);
    };
  }, []);

  useEffect(() => {
    setNotificationWidth();
  }, [notification]);

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
        <Navbar
          open={drawerOpen}
          setOpen={setDrawerOpen}
          toggleUserStatsDrawer={toggleUserStatsDrawer}
          userStatsDrawerOpen={hcaptchaDrawerOpen}
        />
        {renderDrawer(drawerOpen, setDrawerOpen)}
        {isHCaptchaLabelingPage && renderHCaptchaStatisticsDrawer
          ? renderHCaptchaStatisticsDrawer(hcaptchaDrawerOpen)
          : null}
        <Main isMobile={isMobile} open={drawerOpen}>
          <Grid
            component="div"
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
              sx={{
                height: '3.2rem',
                [breakpoints.mobile]: {
                  height: 'unset',
                  position: 'absolute',
                  zIndex: 2000,
                  top: '0',
                  left: '0',
                  width: notificationWith ? `${notificationWith}px` : 'unset',
                },
              }}
            >
              <Grid
                item
                sx={{
                  minHeight: '3.2rem',
                  position: 'fixed',
                  width: notificationWith ? `${notificationWith}px` : 'unset',
                  zIndex: '10',
                  [breakpoints.mobile]: {
                    minHeight: 'unset',
                  },
                }}
              >
                {notification ? (
                  <Grid
                    sx={{
                      minHeight: '3.2rem',
                      position: 'relative',
                      zIndex: '10',
                    }}
                  >
                    <TopNotification
                      onClose={() => {
                        setNotification(null);
                      }}
                      type={notification.type}
                    >
                      {notification.content}
                    </TopNotification>
                  </Grid>
                ) : null}
              </Grid>
            </Grid>

            <Grid item>
              <PageHeader {...pageHeaderProps} />
            </Grid>
            <Grid
              component="div"
              // @ts-expect-error -- ...
              ref={layoutElementRef}
              sx={{ height: '100%' }}
            >
              <Outlet />
            </Grid>
          </Grid>
        </Main>
        <Footer displayChatIcon={!isMobile || !drawerOpen} isProtected />
      </Grid>
    </ProtectedLayoutContext.Provider>
  );
}

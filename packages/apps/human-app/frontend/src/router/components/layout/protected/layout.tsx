import { Box, Stack, styled } from '@mui/material';
import type { Dispatch, ReactElement, SetStateAction } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useIsHCaptchaLabelingPage } from '@/shared/hooks/use-is-hcaptcha-labeling-page';
import { GovernanceBanner } from '@/modules/governance-banner/components/governance-banner';
import { Footer } from '../../footer';
import { Navbar } from './navbar';
//import { type PageHeaderProps, PageHeader } from './page-header';
import { useColorMode } from '@/shared/contexts/color-mode/use-color-mode';
import { DesktopAsideBar } from './desktop-aside-bar';
import { ProfileBottomTray } from '@/modules/worker/profile/components/profile-bottom-tray';
import { MOBILE_BOTTOM_TRAY_HEIGHT } from '@/shared/consts';
import { routerPaths } from '@/router/router-paths';

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open',
})<{
  open?: boolean;
}>(({ theme, open }) => ({
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
  }),
}));

export function ProtectedLayout({
  // pageHeaderProps,
  // renderDrawer,
  renderHCaptchaStatisticsDrawer,
  renderGovernanceBanner,
}: {
  //pageHeaderProps: PageHeaderProps;
  renderDrawer: (
    open: boolean,
    setDrawerOpen: Dispatch<SetStateAction<boolean>>
  ) => ReactElement;
  renderHCaptchaStatisticsDrawer?: (isOpen: boolean) => ReactElement;
  renderGovernanceBanner?: boolean;
}) {
  const layoutElementRef = useRef<HTMLDivElement | null>(null);
  const isHCaptchaLabelingPage = useIsHCaptchaLabelingPage();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [hcaptchaDrawerOpen, setHcaptchaDrawerOpen] = useState(false);
  const { colorPalette } = useColorMode();
  const location = useLocation();
  const toggleUserStatsDrawer = isHCaptchaLabelingPage
    ? () => {
        setHcaptchaDrawerOpen((state) => !state);
      }
    : undefined;

  const isProfilePage = location.pathname === routerPaths.worker.profile;
  const isBottomTrayVisible = isMobile && !isProfilePage;

  useEffect(() => {
    if (isMobile) {
      setHcaptchaDrawerOpen(false);
      setDrawerOpen(false);
    } else {
      setHcaptchaDrawerOpen(false);
      setDrawerOpen(true);
    }
  }, [isMobile]);

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      sx={{
        flexWrap: 'nowrap',
        minHeight: '100vh',
        height: '100%',
        width: '100%',
        p: { xs: 0, md: 2 },
        pr: { xs: 0, md: 4 },
        pb: { xs: isBottomTrayVisible ? MOBILE_BOTTOM_TRAY_HEIGHT : 0, md: 2 },
        gap: 2,
        bgcolor: {
          xs: colorPalette.background.paper,
          md: colorPalette.background.default,
        },
      }}
    >
      {isMobile && (
        <Navbar
          open={drawerOpen}
          setOpen={setDrawerOpen}
          toggleUserStatsDrawer={toggleUserStatsDrawer}
          userStatsDrawerOpen={hcaptchaDrawerOpen}
        />
      )}

      {!isMobile && <DesktopAsideBar />}
      {/* {renderDrawer(drawerOpen, setDrawerOpen)} */}
      {isHCaptchaLabelingPage && renderHCaptchaStatisticsDrawer
        ? renderHCaptchaStatisticsDrawer(hcaptchaDrawerOpen)
        : null}
      <Stack
        sx={{
          flex: 1,
          py: { xs: 0, md: 4 },
          //px: { xs: 2, md: 4 },
          gap: { xs: 0, md: 3 },
          bgcolor: colorPalette.background.paper,
          borderRadius: { xs: '0px', md: '30px' },
          border: {
            xs: 'none',
            md: `1px solid ${colorPalette.border.main}`,
          },
        }}
      >
        <Main open={drawerOpen}>
          <Stack
            sx={{
              width: '100%',
              flexWrap: 'nowrap',
            }}
          >
            {renderGovernanceBanner && <GovernanceBanner />}
            {/* <PageHeader {...pageHeaderProps} /> */}
            <Box ref={layoutElementRef} sx={{ height: '100%' }}>
              <Outlet />
            </Box>
          </Stack>
          {isBottomTrayVisible && <ProfileBottomTray />}
        </Main>
        <Footer displayChatIcon={!isMobile || !drawerOpen} isProtected />
      </Stack>
    </Stack>
  );
}

import { useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Stack, styled } from '@mui/material';

import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { GovernanceBanner } from '@/modules/governance-banner/components/governance-banner';
import { Footer } from '../../footer';
import { Navbar } from './navbar';
import { useColorMode } from '@/shared/contexts/color-mode/use-color-mode';
import { DesktopAsideBar } from './desktop-aside-bar';
import { ProfileBottomTray } from '@/modules/worker/profile/components/profile-bottom-tray';
import { MOBILE_BOTTOM_TRAY_HEIGHT } from '@/shared/consts';
import { routerPaths } from '@/router/router-paths';

const Main = styled('main')({
  display: 'flex',
  flex: '1',
  width: '100%',
});

export function ProtectedLayout() {
  const layoutElementRef = useRef<HTMLDivElement | null>(null);

  const isMobile = useIsMobile();
  const { colorPalette } = useColorMode();
  const location = useLocation();

  const isProfilePage = location.pathname === routerPaths.worker.profile;
  const isBottomTrayVisible = isMobile && !isProfilePage;

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
      {isMobile && <Navbar />}
      {!isMobile && <DesktopAsideBar />}
      <Stack
        sx={{
          flex: 1,
          py: { xs: 0, md: 4 },
          gap: { xs: 0, md: 3 },
          bgcolor: colorPalette.background.paper,
          borderRadius: { xs: '0px', md: '30px' },
          border: {
            xs: 'none',
            md: `1px solid ${colorPalette.border.main}`,
          },
        }}
      >
        <Main>
          <Stack
            sx={{
              width: '100%',
              flexWrap: 'nowrap',
            }}
          >
            <GovernanceBanner />
            <Box ref={layoutElementRef} sx={{ height: '100%' }}>
              <Outlet />
            </Box>
          </Stack>
          {isBottomTrayVisible && <ProfileBottomTray />}
        </Main>
        <Footer displayChatIcon={!isMobile} isProtected />
      </Stack>
    </Stack>
  );
}

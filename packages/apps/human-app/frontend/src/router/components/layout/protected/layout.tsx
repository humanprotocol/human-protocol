import { Box, Stack, styled } from '@mui/material';
import type { Dispatch, ReactElement, SetStateAction } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useBackgroundContext } from '@/shared/contexts/background';
import { breakpoints } from '@/shared/styles/breakpoints';
import { useIsHCaptchaLabelingPage } from '@/shared/hooks/use-is-hcaptcha-labeling-page';
import { GovernanceBanner } from '@/modules/governance-banner/components/governance-banner';
import { Footer } from '../../footer';
import { Navbar } from './navbar';
import { type PageHeaderProps, PageHeader } from './page-header';

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

export function ProtectedLayout({
  pageHeaderProps,
  renderDrawer,
  renderHCaptchaStatisticsDrawer,
  renderGovernanceBanner,
}: Readonly<{
  pageHeaderProps: PageHeaderProps;
  renderDrawer: (
    open: boolean,
    setDrawerOpen: Dispatch<SetStateAction<boolean>>
  ) => ReactElement;
  renderHCaptchaStatisticsDrawer?: (isOpen: boolean) => ReactElement;
  renderGovernanceBanner?: boolean;
}>) {
  const layoutElementRef = useRef<HTMLDivElement | null>(null);
  const isHCaptchaLabelingPage = useIsHCaptchaLabelingPage();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [hcaptchaDrawerOpen, setHcaptchaDrawerOpen] = useState(false);
  const { backgroundColor, setGrayBackground } = useBackgroundContext();
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

  useEffect(() => {
    setGrayBackground();
  }, [setGrayBackground]);

  return (
    <Stack
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
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
        <Stack
          sx={{
            width: '100%',
            margin: !isMobile ? '5.2rem 0 1rem 0' : '1rem 0',
            py: 0,
            px: 4,
            gap: 4,
            flexWrap: 'nowrap',
            [breakpoints.mobile]: {
              gap: 2,
              px: 2,
            },
          }}
        >
          {renderGovernanceBanner && <GovernanceBanner />}
          <PageHeader {...pageHeaderProps} />
          <Box ref={layoutElementRef} sx={{ height: '100%' }}>
            <Outlet />
          </Box>
        </Stack>
      </Main>
      <Footer displayChatIcon={!isMobile || !drawerOpen} isProtected />
    </Stack>
  );
}

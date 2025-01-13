import { Grid, styled } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useBackgroundColorContext } from '@/shared/hooks/use-background-color-context';
import type { PageHeaderProps } from '@/shared/components/layout/protected/page-header';
import { PageHeader } from '@/shared/components/layout/protected/page-header';
import { breakpoints } from '@/shared/styles/breakpoints';
import { useIsHCaptchaLabelingPage } from '@/shared/hooks/use-is-hcaptcha-labeling-page';
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
  const layoutElementRef = useRef<HTMLDivElement>();
  const isHCaptchaLabelingPage = useIsHCaptchaLabelingPage();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [hcaptchaDrawerOpen, setHcaptchaDrawerOpen] = useState(false);
  const { backgroundColor, setGrayBackground } = useBackgroundColorContext();
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
            margin: !isMobile ? '5.2rem 0 1rem 0' : '1rem 0',
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
          <Grid item>
            <PageHeader {...pageHeaderProps} />
          </Grid>
          <Grid
            component="div"
            // @ts-expect-error -- MUI accepts this prop even if it's not typed
            ref={layoutElementRef}
            sx={{ height: '100%' }}
          >
            <Outlet />
          </Grid>
        </Grid>
      </Main>
      <Footer displayChatIcon={!isMobile || !drawerOpen} isProtected />
    </Grid>
  );
}

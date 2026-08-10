import { Container, Stack } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useColorMode } from '@/shared/contexts/color-mode';
import { Footer } from '../../footer';
import { Navbar } from './navbar';
import { useIsMainPage } from '@/router/hooks/use-is-main-page';

export function UnprotectedLayout() {
  const { colorPalette, isDarkMode } = useColorMode();
  const isMainPage = useIsMainPage();

  const layoutBackgroundColor = (() => {
    if (isDarkMode || isMainPage) {
      return colorPalette.backgroundColor;
    }

    return colorPalette.paper.main;
  })();

  return (
    <Stack
      sx={{
        alignItems: 'center',
        flexWrap: 'nowrap',
        height: { xs: '100%', md: '100dvh' },
        minHeight: { xs: '100vh', md: 0 },
        width: '100%',
        pt: 0,
        px: { xs: 0, md: 15 },
        backgroundColor: layoutBackgroundColor,
      }}
    >
      <Navbar />
      <Container
        component="main"
        maxWidth="xl"
        sx={{
          p: 0,
          pt: { xs: 4, md: 0 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          minHeight: 0,
        }}
      >
        <Outlet />
      </Container>
      <Footer />
    </Stack>
  );
}

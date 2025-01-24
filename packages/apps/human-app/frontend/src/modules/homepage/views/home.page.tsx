import Box from '@mui/material/Box';
import { Paper } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { t } from 'i18next';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useWeb3Auth } from '@/modules/auth-web3/hooks/use-web3-auth';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { routerPaths } from '@/router/router-paths';
import { Button } from '@/shared/components/ui/button';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { HomeContainer } from '@/modules/homepage/components/home-container';
import { useHomePageState } from '@/shared/hooks/use-homepage-state';

export type HomePageStageType = 'welcome' | 'chooseSignUpAccountType';

export function HomePage() {
  const { colorPalette, isDarkMode } = useColorMode();
  const { pageView, setPageView } = useHomePageState();
  const isMobile = useIsMobile();
  const isMobileMd = useIsMobile('md');
  const { user: worker } = useAuth();
  const { user: operator } = useWeb3Auth();

  if (worker) {
    return <Navigate replace to={routerPaths.worker.profile} />;
  }
  if (operator) {
    return <Navigate replace to={routerPaths.operator.profile} />;
  }

  const paperBackgroundColor = (() => {
    if (isDarkMode) {
      if (isMobile) {
        return colorPalette.backgroundColor;
      }
      return colorPalette.paper.main;
    }

    return colorPalette.white;
  })();

  return (
    <Box width="100%">
      <Paper
        sx={{
          backgroundColor:
            isDarkMode && pageView === 'welcome'
              ? 'inherit'
              : paperBackgroundColor,
          mx: !isMobile ? '30px' : 0,
          boxShadow: 'none',
          borderRadius: '20px',
          position: 'relative',
        }}
      >
        <HomeContainer />
        {pageView === 'chooseSignUpAccountType' && !isMobileMd ? (
          <Button
            onClick={() => {
              setPageView('welcome');
            }}
            sx={{ position: 'absolute', top: '24px', right: '24px' }}
          >
            {t('homepage.cancel')}
          </Button>
        ) : null}
      </Paper>
    </Box>
  );
}

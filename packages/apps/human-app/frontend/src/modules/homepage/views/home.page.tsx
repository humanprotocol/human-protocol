import Box from '@mui/material/Box';
import { Paper } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useWeb3Auth } from '@/modules/auth-web3/hooks/use-web3-auth';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { routerPaths } from '@/router/router-paths';
import { useColorMode } from '@/shared/contexts/color-mode';
import { HomeContainer } from '@/modules/homepage/components';
import { useHomePageState } from '@/shared/contexts/homepage-state';

export type HomePageStageType = 'welcome' | 'chooseSignUpAccountType';

export function HomePage() {
  const { colorPalette, isDarkMode } = useColorMode();
  const { pageView } = useHomePageState();
  const isMobile = useIsMobile();
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
      return colorPalette.paper.main;
    }

    return colorPalette.backgroundColor;
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
      </Paper>
    </Box>
  );
}

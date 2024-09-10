import Box from '@mui/material/Box';
import { Paper } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { t } from 'i18next';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useWeb3Auth } from '@/auth-web3/use-web3-auth';
import { useAuth } from '@/auth/use-auth';
import { routerPaths } from '@/router/router-paths';
import { Button } from '@/components/ui/button';
import { useColorMode } from '@/hooks/use-color-mode';
import { HomeContainer } from './components/home-container';

export type HomePageStageType = 'welcome' | 'chooseSignUpAccountType';

export function HomePage() {
  const { colorPalette } = useColorMode();
  const [stage, setStage] = useState<HomePageStageType>('welcome');
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

  return (
    <Box width="100%">
      <Paper
        sx={{
          backgroundColor: colorPalette.white,
          mx: !isMobile ? '30px' : 0,
          boxShadow: 'none',
          borderRadius: '20px',
          position: 'relative',
        }}
      >
        <HomeContainer setStage={setStage} stage={stage} />
        {stage === 'chooseSignUpAccountType' && !isMobileMd ? (
          <Button
            onClick={() => {
              setStage('welcome');
            }}
            sx={{ position: 'absolute', top: '15px', right: '15px' }}
          >
            {t('homepage.cancel')}
          </Button>
        ) : null}
      </Paper>
    </Box>
  );
}

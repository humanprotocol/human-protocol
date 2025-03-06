import { Grid } from '@mui/material';
import { useEffect } from 'react';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useBackgroundContext } from '@/shared/contexts/background';
import { SignInSection } from './sign-in-section';
import { LogoSection } from './logo-section';

export function Welcome() {
  const { isDarkMode } = useColorMode();
  const { setWhiteBackground } = useBackgroundContext();
  const isMobile = useIsMobile('lg');

  useEffect(() => {
    if (!isDarkMode) {
      setWhiteBackground();
    }
  }, [isDarkMode, setWhiteBackground]);

  return (
    <Grid
      container
      spacing={isMobile ? 0 : 10}
      sx={{ paddingBottom: isMobile ? '44px' : 0 }}
    >
      <Grid container item justifyContent="center" xs={isMobile ? 12 : 6}>
        <LogoSection />
      </Grid>
      <Grid item justifyContent="flex-end" xs={isMobile ? 12 : 6}>
        <SignInSection />
      </Grid>
    </Grid>
  );
}

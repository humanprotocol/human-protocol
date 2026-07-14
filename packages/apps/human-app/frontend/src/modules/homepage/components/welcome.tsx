import { Grid } from '@mui/material';
import { useEffect } from 'react';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useBackgroundContext } from '@/shared/contexts/background';
import { SignInSection } from './sign-in-section';
import { LogoSection } from './logo-section';

export function Welcome() {
  const { isDarkMode } = useColorMode();
  const { setWhiteBackground } = useBackgroundContext();

  useEffect(() => {
    if (!isDarkMode) {
      setWhiteBackground();
    }
  }, [isDarkMode, setWhiteBackground]);

  return (
    <Grid
      container
      spacing={{ xs: 0, lg: 10 }}
      sx={{ width: '100%', pb: { xs: '44px', lg: 0 } }}
    >
      <Grid size={{ xs: 12, lg: 6 }} sx={{ justifyContent: 'center' }}>
        <LogoSection />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }} sx={{ justifyContent: 'flex-end' }}>
        <SignInSection />
      </Grid>
    </Grid>
  );
}

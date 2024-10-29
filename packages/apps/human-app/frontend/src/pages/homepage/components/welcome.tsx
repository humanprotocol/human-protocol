import { Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import {
  HomepageLogoIcon,
  HomepageUserIcon,
  HomepageWorkIcon,
  MobileHomeIcons,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { OperatorSignIn } from '@/pages/homepage/components/operator-signin';
import { WorkerSignIn } from '@/pages/homepage/components/worker-signin';
import { useColorMode } from '@/hooks/use-color-mode';
import { useHomePageState } from '@/contexts/homepage-state';
import { useBackgroundColorStore } from '@/hooks/use-background-store';

function LightModeIcons() {
  return (
    <Stack
      direction="row"
      maxHeight="80px"
      mb="1.5rem"
      sx={{ transform: 'translateX(-4.5%)' }}
    >
      <Grid sx={{ mx: '-8px' }}>
        <HomepageWorkIcon />
      </Grid>
      <Grid sx={{ mx: '-8px' }}>
        <HomepageUserIcon />
      </Grid>
      <Grid sx={{ mx: '-8px' }}>
        <HomepageLogoIcon />
      </Grid>
    </Stack>
  );
}

function DarkModeIcons() {
  return (
    <Stack
      sx={{
        width: '288px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}
    >
      <HomepageWorkIcon />
      <HomepageUserIcon />
      <HomepageLogoIcon />
    </Stack>
  );
}

export function Welcome() {
  const { colorPalette, isDarkMode } = useColorMode();
  const { setWhiteBackground } = useBackgroundColorStore();
  const { setPageView } = useHomePageState();
  const { t } = useTranslation();
  const logoText: string = t('homepage.humanApp');
  const logoTextSplit: string[] = logoText.split(' ');
  const isMobile = useIsMobile('lg');

  useEffect(() => {
    if (!isDarkMode) {
      setWhiteBackground();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Grid
      container
      spacing={isMobile ? 0 : 10}
      sx={{
        paddingBottom: isMobile ? '44px' : 0,
      }}
    >
      <Grid container item justifyContent="center" xs={isMobile ? 12 : 6}>
        <Grid container direction="column" justifyContent="center">
          {isMobile ? (
            <Stack
              alignItems="center"
              direction="row"
              justifyContent="center"
              sx={{ svg: { margin: '-1.4rem' } }}
            >
              <MobileHomeIcons />
            </Stack>
          ) : (
            <>{isDarkMode ? <DarkModeIcons /> : <LightModeIcons />}</>
          )}
          <Stack
            direction="row"
            justifyContent={isMobile ? 'center' : 'flex-start'}
            sx={{
              marginTop: '0',
            }}
          >
            <Typography variant="h1">{logoTextSplit[0]}</Typography>
            <Typography
              sx={{
                fontWeight: '400',
                marginLeft: '1.25rem',
              }}
              variant="h1"
            >
              {logoTextSplit[1]}
            </Typography>
          </Stack>
          <Typography
            sx={{
              marginTop: '1.875rem',
              marginBottom: '3.8125rem',
              typography: { md: 'h5' },
            }}
            textAlign={isMobile ? 'center' : 'left'}
            variant="h6"
          >
            {t('homepage.completeJobs')}
          </Typography>
        </Grid>
      </Grid>
      <Grid item justifyContent="flex-end" xs={isMobile ? 12 : 6}>
        <Paper
          sx={{
            px: isMobile ? '16px' : '4.1875rem',
            py: isMobile ? '32px' : '4.8125rem',
            backgroundColor: colorPalette.paper.light,
            boxShadow: 'none',
            borderRadius: '20px',
          }}
        >
          <Button
            fullWidth
            onClick={() => {
              setPageView('chooseSignUpAccountType');
            }}
            size="large"
            sx={{
              backgroundColor: isDarkMode
                ? '#5D0CE9'
                : colorPalette.primary.light,
              mb: '1.5625rem',
              color: isDarkMode ? '#CDC7FF' : undefined,
            }}
            variant="contained"
          >
            {t('homepage.signUp')}
          </Button>
          <Divider
            component="div"
            sx={{
              mb: '1.5625rem',
            }}
            variant="middle"
          />
          <WorkerSignIn />
          <OperatorSignIn />
        </Paper>
      </Grid>
    </Grid>
  );
}

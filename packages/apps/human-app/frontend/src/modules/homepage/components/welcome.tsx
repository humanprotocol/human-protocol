import { Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import {
  HomepageLogoIcon,
  HomepageUserIcon,
  HomepageWorkIcon,
  MobileHomeIcons,
} from '@/shared/components/ui/icons';
import { Button } from '@/shared/components/ui/button';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { OperatorSignIn } from '@/modules/homepage/hooks/use-operator-signin';
import { WorkerSignIn } from '@/modules/homepage/components/worker-signin';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useHomePageState } from '@/shared/contexts/homepage-state';
import { useBackgroundColorContext } from '@/shared/contexts/background';

export function Welcome() {
  const { colorPalette, isDarkMode } = useColorMode();
  const { setWhiteBackground } = useBackgroundColorContext();
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
            <Stack
              direction="row"
              maxHeight="80px"
              mb="1.5rem"
              sx={{ transform: 'translateX(-4.5%)' }}
            >
              <Grid sx={{ mx: '24px' }}>
                <HomepageWorkIcon />
              </Grid>
              <Grid sx={{ mx: '24px' }}>
                <HomepageUserIcon />
              </Grid>
              <Grid sx={{ mx: '24px' }}>
                <HomepageLogoIcon />
              </Grid>
            </Stack>
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
            color="secondary"
            fullWidth
            onClick={() => {
              setPageView('chooseSignUpAccountType');
            }}
            size="large"
            sx={{
              mb: '1.5625rem',
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

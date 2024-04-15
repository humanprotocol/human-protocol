import { Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  HomepageLogoIcon,
  HomepageUserIcon,
  HomepageWorkIcon,
  MobileHeaderIcon,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { colorPalette } from '@/styles/color-palette';
import { useIsMobile } from '@/hooks/use-is-mobile';

interface SignInProps {
  setStep: (step: number) => void;
}

export function SignIn({ setStep }: SignInProps) {
  const { t } = useTranslation();
  const logoText: string = t('components.signUpPage.humanApp');
  const logoTextSplit: string[] = logoText.split(' ');
  const isMobile = useIsMobile();

  return (
    <Grid
      container
      spacing={isMobile ? 0 : 10}
      sx={{
        paddingBottom: isMobile ? '44px' : 0,
      }}
    >
      <Grid item justifyContent="flex-end" xs={isMobile ? 12 : 6}>
        <Grid direction="column" item>
          {isMobile ? (
            <Stack alignItems="center" direction="row" justifyContent="center">
              <MobileHeaderIcon />
            </Stack>
          ) : (
            <Stack direction="row">
              <HomepageLogoIcon />
              <HomepageUserIcon />
              <HomepageWorkIcon />
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
            }}
            textAlign={isMobile ? 'center' : 'left'}
            variant="h5"
          >
            {t('components.signUpPage.completeJobs')}
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
          }}
        >
          <Button
            fullWidth
            onClick={() => {
              setStep(1);
            }}
            size="large"
            sx={{
              backgroundColor: colorPalette.primary.light,
              mb: '1.5625rem',
            }}
            variant="contained"
          >
            {t('components.signUpPage.signUp')}
          </Button>
          <Divider
            component="div"
            sx={{
              mb: '1.5625rem',
            }}
            variant="middle"
          />
          <Button
            fullWidth
            size="large"
            sx={{
              mb: '1.5625rem',
            }}
            variant="contained"
          >
            {t('components.signUpPage.workerSignIn')}
          </Button>
          <Button fullWidth size="large" variant="outlined">
            {t('components.signUpPage.operatorSignIn')}
          </Button>
        </Paper>
      </Grid>
    </Grid>
  );
}

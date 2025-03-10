import { Grid, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  MobileHomeIcons,
  HomepageWorkIcon,
  HomepageUserIcon,
  HomepageLogoIcon,
} from '@/shared/components/ui/icons';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

export function LogoSection() {
  const { t } = useTranslation();
  const logoText: string = t('homepage.humanApp');
  const logoTextSplit: string[] = logoText.split(' ');
  const isMobile = useIsMobile('lg');

  return (
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
        sx={{ marginTop: '0' }}
      >
        <Typography variant="h1">{logoTextSplit[0]}</Typography>
        <Typography
          sx={{ fontWeight: '400', marginLeft: '1.25rem' }}
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
  );
}

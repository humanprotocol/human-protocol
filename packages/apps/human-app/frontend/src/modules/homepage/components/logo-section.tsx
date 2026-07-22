import { Grid, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export function LogoSection() {
  const { t } = useTranslation();
  const logoText: string = t('homepage.humanApp');
  const logoTextSplit: string[] = logoText.split(' ');

  return (
    <Grid
      container
      sx={{
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: { xs: 'center', lg: 'flex-start' },
      }}
    >
      <Stack
        direction="row"
        sx={{
          justifyContent: { xs: 'center', md: 'flex-start' },
          mt: 0,
        }}
      >
        <Typography variant="h1">{logoTextSplit[0]}</Typography>
        <Typography variant="h1" sx={{ fontWeight: '400', ml: 2.5 }}>
          {logoTextSplit[1]}
        </Typography>
      </Stack>
      <Typography
        variant="h6"
        sx={{
          mt: '1.875rem',
          mb: '3.8125rem',
          typography: { md: 'h5' },
          textAlign: { xs: 'center', md: 'left' },
        }}
      >
        {t('homepage.completeJobs')}
      </Typography>
    </Grid>
  );
}

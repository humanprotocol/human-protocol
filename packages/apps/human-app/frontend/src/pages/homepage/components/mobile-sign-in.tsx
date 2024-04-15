import { Grid, Typography, Button, Link, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MobileHeaderIcon } from '@/components/ui/icons';
import { colorPalette } from '@/styles/color-palette';

export function MobileSignIn() {
  const { t } = useTranslation();
  const logoText: string = t('components.signUpPage.humanApp');
  const logoTextSplit: string[] = logoText.split(' ');

  return (
    <Grid container justifyContent="center">
      <Grid item xs={12}>
        <Box
          sx={{
            width: '100%',
            textAlign: 'center',
          }}
        >
          <MobileHeaderIcon />
        </Box>
        <Typography align="center" variant="h1">
          {logoTextSplit[0]}{' '}
          <Typography
            sx={{
              fontWeight: '400',
              display: 'inline-block',
            }}
            variant="h1"
          >
            {logoTextSplit[1]}
          </Typography>
        </Typography>
        <Typography
          sx={{
            marginTop: '1.875rem',
            marginBottom: '3.8125rem',
          }}
          textAlign="center"
          variant="subtitle2"
        >
          {t('components.signUpPage.completeJobs')}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Button
          fullWidth
          size="large"
          sx={{
            mb: '1.5625rem',
          }}
          variant="contained"
        >
          {t('components.signUpPage.signUp')}
        </Button>
        <Button fullWidth size="large" variant="outlined">
          {t('components.signUpPage.logIn')}
        </Button>
        <Link
          sx={{
            width: '100%',
            display: 'block',
            textAlign: 'center',
            marginTop: '15px',
            cursor: 'pointer',
          }}
        >
          <Typography color={colorPalette.text.secondary} variant="caption">
            {t('components.signUpPage.termsAndConditions')}
          </Typography>
        </Link>
      </Grid>
    </Grid>
  );
}

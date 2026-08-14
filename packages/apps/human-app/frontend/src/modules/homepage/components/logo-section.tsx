import { Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export function LogoSection() {
  const { t } = useTranslation();

  const logoText = t('homepage.humanApp');
  const logoTextSplit = logoText.split(' ');

  return (
    <Stack
      sx={{
        justifyContent: 'center',
        alignItems: { xs: 'center', lg: 'flex-start' },
        gap: 4,
      }}
    >
      <Stack
        direction="row"
        sx={{
          justifyContent: { xs: 'center', md: 'flex-start' },
        }}
      >
        <Typography variant="h1">
          {logoTextSplit[0]}
          <Typography
            component="span"
            variant="h1"
            sx={{ fontWeight: '400', ml: 2.5 }}
          >
            {logoTextSplit[1]}
          </Typography>
        </Typography>
      </Stack>
      <Typography variant="h5" sx={{ textAlign: { xs: 'center', md: 'left' } }}>
        {t('homepage.completeJobs')}
      </Typography>
    </Stack>
  );
}

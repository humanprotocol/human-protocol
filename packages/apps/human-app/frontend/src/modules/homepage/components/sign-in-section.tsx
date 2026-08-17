import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Paper, Button } from '@mui/material';

import { routerPaths } from '@/router/router-paths';

export function SignInSection() {
  const { t } = useTranslation();

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        px: { xs: 2, lg: 8 },
        py: { xs: 4, lg: 10 },
        bgcolor: 'background.light',
        boxShadow: 'none',
        borderRadius: '20px',
        gap: 2,
      }}
    >
      <Button
        component={Link}
        to={routerPaths.signUp}
        variant="contained"
        size="large"
        color="primary"
        fullWidth
      >
        {t('homepage.signUp')}
      </Button>
      <Button
        component={Link}
        to={routerPaths.signIn}
        variant="contained"
        size="large"
        color="accent"
        fullWidth
      >
        {t('homepage.signIn')}
      </Button>
    </Paper>
  );
}

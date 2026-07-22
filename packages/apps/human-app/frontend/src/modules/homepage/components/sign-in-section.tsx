import { Paper, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '@/shared/contexts/color-mode';
import { routerPaths } from '@/router/router-paths';

export function SignInSection() {
  const { colorPalette } = useColorMode();
  const { t } = useTranslation();

  return (
    <Paper
      sx={{
        display: 'flex',
        flexDirection: 'column',
        px: { xs: 2, lg: 8 },
        py: { xs: 4, lg: 10 },
        backgroundColor: colorPalette.paper.light,
        boxShadow: 'none',
        borderRadius: '20px',
        gap: 2,
      }}
    >
      <Button
        component={Link}
        to={routerPaths.worker.signUp}
        variant="contained"
        size="large"
        color="secondary"
        fullWidth
      >
        {t('homepage.signUp')}
      </Button>
      <Button
        component={Link}
        to={routerPaths.worker.signIn}
        variant="contained"
        size="large"
        fullWidth
      >
        {t('homepage.signIn')}
      </Button>
    </Paper>
  );
}

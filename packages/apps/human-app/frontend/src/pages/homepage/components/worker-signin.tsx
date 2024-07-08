import { t } from 'i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { routerPaths } from '@/router/router-paths';

export function WorkerSignIn() {
  return (
    <Button
      component={Link}
      fullWidth
      size="large"
      sx={{
        mb: '1.5625rem',
      }}
      to={routerPaths.worker.signIn}
      variant="contained"
    >
      {t('homepage.workerSignIn')}
    </Button>
  );
}

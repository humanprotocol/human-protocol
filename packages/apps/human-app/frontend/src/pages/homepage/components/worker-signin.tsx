import { t } from 'i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/use-auth';
import { Button } from '@/components/ui/button';
import { routerPaths } from '@/router/router-paths';

export function WorkerSignIn() {
  const { user } = useAuth();

  const redirectPath = user
    ? routerPaths.worker.profile
    : routerPaths.worker.signIn;

  return (
    <Button
      component={Link}
      fullWidth
      size="large"
      sx={{
        mb: '1.5625rem',
      }}
      to={redirectPath}
      variant="contained"
    >
      {t('homepage.workerSignIn')}
    </Button>
  );
}

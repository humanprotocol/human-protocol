import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { colorPalette } from '@/styles/color-palette';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { Button } from '@/components/ui/button';
import { routerPaths } from '@/router/router-paths';

export function ProfileData() {
  const { user } = useAuthenticatedUser();
  const { t } = useTranslation();
  return (
    <Grid container flexDirection="column" gap="2rem">
      <Grid>
        <Typography variant="subtitle2">{t('worker.profile.email')}</Typography>
        <Typography color={colorPalette.text.primary} variant="subtitle1">
          {user.email}
        </Typography>
      </Grid>
      <Grid>
        <Button
          color="secondary"
          component={Link}
          sx={{
            padding: 0,
            ':hover': {
              backgroundColor: 'inherit',
            },
          }}
          to={routerPaths.worker.sendResetLink}
          variant="text"
        >
          {t('worker.profile.resetPassword')}
        </Button>
      </Grid>
    </Grid>
  );
}

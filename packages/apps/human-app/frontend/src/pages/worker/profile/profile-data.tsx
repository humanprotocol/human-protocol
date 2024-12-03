import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { Button } from '@/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { useColorMode } from '@/hooks/use-color-mode';
import { onlyDarkModeColor } from '@/styles/dark-color-palette';

export function ProfileData() {
  const { colorPalette, isDarkMode } = useColorMode();
  const { user } = useAuthenticatedUser();
  const { t } = useTranslation();
  return (
    <Grid container flexDirection="column" gap="2rem">
      <Grid>
        <Typography variant="subtitle2">{t('worker.profile.email')}</Typography>
        <Typography
          color={colorPalette.text.primary}
          sx={{ wordBreak: 'break-all' }}
          variant="subtitle1"
        >
          {user.email}
        </Typography>
      </Grid>
      <Grid>
        <Button
          component={Link}
          sx={{
            padding: 0,
            color: isDarkMode
              ? onlyDarkModeColor.additionalTextColor
              : colorPalette.secondary.main,
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

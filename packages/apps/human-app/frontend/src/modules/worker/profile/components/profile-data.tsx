import { Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { Button } from '@/shared/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { useColorMode } from '@/shared/contexts/color-mode';
import { onlyDarkModeColor } from '@/shared/styles/dark-color-palette';

export function ProfileData() {
  const { colorPalette, isDarkMode } = useColorMode();
  const { user } = useAuthenticatedUser();
  const { t } = useTranslation();
  return (
    <Stack sx={{ gap: 3 }}>
      <Stack>
        <Typography variant="subtitle2">{t('worker.profile.email')}</Typography>
        <Typography
          variant="subtitle1"
          sx={{ color: colorPalette.text.primary, wordBreak: 'break-all' }}
        >
          {user.email}
        </Typography>
      </Stack>
      <Stack>
        <Typography variant="subtitle2">
          {t('worker.profile.password')}
        </Typography>
        <Button
          component={Link}
          to={routerPaths.worker.sendResetLink}
          variant="text"
          sx={{
            width: 'fit-content',
            padding: 0,
            color: isDarkMode
              ? onlyDarkModeColor.additionalTextColor
              : colorPalette.secondary.main,
            ':hover': {
              backgroundColor: 'inherit',
            },
          }}
        >
          {t('worker.profile.resetPassword')}
        </Button>
      </Stack>
    </Stack>
  );
}

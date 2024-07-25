import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';

export function ProfileEmailNotification() {
  const { user } = useAuthenticatedUser();
  const { t } = useTranslation();

  return (
    <Grid container flexDirection="column" gap="2rem">
      <Typography variant="buttonMedium">
        {t('worker.profile.emailNotifications')}
      </Typography>
      <Stack alignItems="center" flexDirection="row">
        <Typography variant="body1">
          {t('worker.profile.notificationsConsent')}
        </Typography>
        <Switch checked={user.email_notifications} />
      </Stack>
    </Grid>
  );
}

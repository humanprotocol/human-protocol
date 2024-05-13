import { Container, Grid, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/protected/page-header';
import { ProfileIcon } from '@/components/ui/icons';
import { colorPalette } from '@/styles/color-palette';
import { ProfileData } from '@/pages/worker/profile/profile-data';
import { ProfileActions } from '@/pages/worker/profile/profile-actions';
import { ProfileNotification } from '@/pages/worker/profile/profile-notifications';

export function WorkerProfilePage() {
  const { t } = useTranslation();

  return (
    <Container maxWidth="xl">
      <PageHeader
        headerIcon={<ProfileIcon />}
        headerText={t('worker.profile.profileHeader')}
      />
      <Paper
        sx={{
          backgroundColor: colorPalette.white,
          minHeight: '100%',
          boxShadow: 'none',
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Grid
          container
          sx={{
            maxWidth: '376px',
            gap: '3rem',
          }}
        >
          <ProfileData />
          <ProfileActions />
          <ProfileNotification />
        </Grid>
      </Paper>
    </Container>
  );
}

import { Grid, Paper } from '@mui/material';
import { colorPalette } from '@/styles/color-palette';
import { ProfileData } from '@/pages/worker/profile/profile-data';
import { ProfileActions } from '@/pages/worker/profile/profile-actions';
import { ProfileNotification } from '@/pages/worker/profile/profile-notifications';

export function WorkerProfilePage() {
  return (
    <Paper
      sx={{
        backgroundColor: colorPalette.white,
        height: '100%',
        boxShadow: 'none',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '20px',
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
  );
}

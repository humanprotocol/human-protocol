import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import { Grid, Typography } from '@mui/material';
import { t } from 'i18next';
import { UserStatsDetails } from '@/pages/worker/hcaptcha-labeling/hcaptcha-labeling/user-stats-details';
import type { HCaptchaUserStatsSuccess } from '@/api/servieces/worker/hcaptcha-user-stats';
import { useHCaptchaUserStats } from '@/api/servieces/worker/hcaptcha-user-stats';
import { Loader } from '@/components/ui/loader';
import { Alert } from '@/components/ui/alert';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';

export interface UserStatsDrawerNavigationProps {
  isOpen: boolean;
}

function UserStatsDrawerContent({
  stats,
  refetch,
}: {
  stats: HCaptchaUserStatsSuccess;
  refetch: () => void;
}) {
  return (
    <>
      <Typography variant="mobileHeaderLarge">
        {t('worker.hcaptchaLabelingStats.hCapchaStatistics')}
      </Typography>
      <UserStatsDetails refetch={refetch} stats={stats} />
    </>
  );
}

export function UserStatsDrawer({ isOpen }: UserStatsDrawerNavigationProps) {
  const {
    data: hcaptchaUserStats,
    error: hcaptchaUserStatsError,
    status: hcaptchaUserStatsStatus,
    refetch: hcaptchaUserStatsRefetch,
  } = useHCaptchaUserStats();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <CssBaseline />
      <Drawer
        anchor="left"
        open={isOpen}
        sx={{
          width: '100%',
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: '100%',
            boxSizing: 'border-box',
            paddingTop: '44px',
          },
        }}
        variant="persistent"
      >
        <Grid
          container
          sx={{
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            flexDirection: 'column',
            gap: '2rem',
            marginTop: '50px',
          }}
        >
          {hcaptchaUserStatsStatus === 'success' ? (
            <UserStatsDrawerContent
              refetch={() => {
                void hcaptchaUserStatsRefetch();
              }}
              stats={hcaptchaUserStats}
            />
          ) : null}
          {hcaptchaUserStatsStatus === 'error' ? (
            <Alert color="error" severity="error">
              {defaultErrorMessage(hcaptchaUserStatsError)}
            </Alert>
          ) : null}
          {hcaptchaUserStatsStatus === 'pending' ? (
            <Loader sx={{ zIndex: '55' }} />
          ) : null}
        </Grid>
      </Drawer>
    </Box>
  );
}

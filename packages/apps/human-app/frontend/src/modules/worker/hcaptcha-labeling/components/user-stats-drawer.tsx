import { Box, CssBaseline, Drawer, Stack, Typography } from '@mui/material';
import { t } from 'i18next';
import { Loader } from '@/shared/components/ui/loader';
import { Alert } from '@/shared/components/ui/alert';
import { getErrorMessageForError } from '@/shared/errors';
import { useHCaptchaUserStats } from '../hooks';
import { UserStatsDetails } from './user-stats-details';
import { LoadingOverlay } from './user-stats-loading-overlay';

export interface UserStatsDrawerNavigationProps {
  isOpen: boolean;
}

export function UserStatsDrawer({
  isOpen,
}: Readonly<UserStatsDrawerNavigationProps>) {
  const {
    data: hcaptchaUserStats,
    error: hcaptchaUserStatsError,
    status: hcaptchaUserStatsStatus,
    refetch: hcaptchaUserStatsRefetch,
    isRefetching: isHcaptchaUserStatsRefetching,
  } = useHCaptchaUserStats();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <CssBaseline />
      <Drawer
        anchor="left"
        variant="persistent"
        open={isOpen}
        sx={{
          width: '100%',
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: '100%',
            paddingTop: 11,
          },
        }}
      >
        <Box position="relative">
          {isHcaptchaUserStatsRefetching && (
            <LoadingOverlay
              sx={{
                width: 'calc(100% - 16px)',
                height: 'calc(100% - 8px)',
                top: 0,
                left: '8px',
                right: '8px',
                bottom: '8px',
              }}
            />
          )}
          <Stack px={6.5} py={3}>
            {hcaptchaUserStatsStatus === 'success' ? (
              <>
                <Typography variant="mobileHeaderLarge" mb={3}>
                  {t('worker.hcaptchaLabelingStats.hCapchaStatistics')}
                </Typography>
                <UserStatsDetails
                  refetch={() => void hcaptchaUserStatsRefetch()}
                  stats={hcaptchaUserStats}
                  isRefetching={isHcaptchaUserStatsRefetching}
                />
              </>
            ) : null}
            {hcaptchaUserStatsStatus === 'error' ? (
              <Alert color="error" severity="error">
                {getErrorMessageForError(hcaptchaUserStatsError)}
              </Alert>
            ) : null}
            {hcaptchaUserStatsStatus === 'pending' ? (
              <Loader sx={{ zIndex: '55' }} />
            ) : null}
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
}

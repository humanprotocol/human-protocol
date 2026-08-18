import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { t } from 'i18next';

import { Loader } from '@/shared/components/ui/loader';
import { Alert } from '@/shared/components/ui/alert';
import { getErrorMessageForError } from '@/shared/errors';
import { useHCaptchaUserStats } from '../hooks';
import { UserStatsDetails } from './user-stats-details';
import { LoadingOverlay } from './user-stats-loading-overlay';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function UserStatsDrawer({ isOpen, onClose }: Props) {
  const {
    data: hcaptchaUserStats,
    error: hcaptchaUserStatsError,
    isSuccess,
    isPending,
    refetch: hcaptchaUserStatsRefetch,
    isRefetching: isHcaptchaUserStatsRefetching,
  } = useHCaptchaUserStats();

  return (
    <Drawer
      anchor="bottom"
      open={isOpen}
      onClose={onClose}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer,
        '& .MuiDrawer-paper': {
          width: '100%',
          minHeight: '60dvh',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
        },
      }}
    >
      <Stack sx={{ position: 'relative', flex: 1, height: '100%' }}>
        {isHcaptchaUserStatsRefetching && (
          <LoadingOverlay
            sx={{
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
              borderRadius: '0px',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
            }}
          />
        )}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: (theme) => `1px solid ${theme.palette.border.strong}`,
          }}
        >
          <Typography variant="h6">
            {t('worker.hcaptchaLabelingStats.hCapchaStatistics')}
          </Typography>
          <IconButton
            aria-label="Close"
            disableRipple
            sx={{ p: 0, bgcolor: 'transparent' }}
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Stack sx={{ px: 2, my: isSuccess ? 0 : 'auto' }}>
          {isSuccess && (
            <UserStatsDetails
              refetch={() => void hcaptchaUserStatsRefetch()}
              stats={hcaptchaUserStats}
              isRefetching={isHcaptchaUserStatsRefetching}
            />
          )}
          {!!hcaptchaUserStatsError && (
            <Alert color="error" severity="error">
              {getErrorMessageForError(hcaptchaUserStatsError)}
            </Alert>
          )}
          {isPending && <Loader sx={{ zIndex: '55' }} />}
        </Stack>
      </Stack>
    </Drawer>
  );
}

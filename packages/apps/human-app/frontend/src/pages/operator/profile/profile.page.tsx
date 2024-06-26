import { useEffect } from 'react';
import { Grid, List, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useBackgroundColorStore } from '@/hooks/use-background-store';
import { colorPalette } from '@/styles/color-palette';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useGetKeys } from '@/api/servieces/operator/get-keys';
import { useWeb3AuthenticatedUser } from '@/auth-web3/use-web3-authenticated-user';
import { PageCardError, PageCardLoader } from '@/components/ui/page-card';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { ProfileDisableButton } from '@/pages/operator/profile/profile-disable-button';
import { ProfileListItem } from '@/components/ui/profile-list-item';
import { useGetOperatorStats } from '@/api/servieces/operator/get-stats';

export function OperatorProfilePage() {
  const { setGrayBackground } = useBackgroundColorStore();
  const { t } = useTranslation();
  const isMobile = useIsMobile('lg');
  const { user } = useWeb3AuthenticatedUser();
  const {
    data: keysData,
    error: keysError,
    isError: isKeysError,
    isPending: isKeysDataPending,
  } = useGetKeys();

  const {
    data: statsData,
    error: statsError,
    isError: isStatsError,
    isPending: isStatsPending,
    refetch: refetchStats,
  } = useGetOperatorStats();

  useEffect(() => {
    setGrayBackground();
  }, [setGrayBackground]);

  useEffect(() => {
    if (keysData?.url) {
      void refetchStats();
    }
  }, [keysData?.url, refetchStats]);

  if (isKeysDataPending || isStatsPending) {
    return <PageCardLoader />;
  }

  if (isKeysError || isStatsError) {
    return (
      <PageCardError
        errorMessage={defaultErrorMessage(keysError || statsError)}
      />
    );
  }

  return (
    <Grid container spacing={4}>
      <Grid item xs={isMobile ? 12 : 8}>
        <Paper
          sx={{
            backgroundColor: colorPalette.white,
            height: '100%',
            boxShadow: 'none',
            padding: '40px',
            borderRadius: '20px',
          }}
        >
          <Typography
            color={colorPalette.text.primary}
            sx={{
              fontWeight: 600,
            }}
            variant="h5"
          >
            {t('operator.profile.about.header')}
          </Typography>
          <Stack flexDirection="row">
            <List sx={{ overflow: 'hidden' }}>
              <ProfileListItem
                header={t('operator.profile.about.role')}
                paragraph={
                  keysData.role ||
                  t('operator.addKeysPage.existingKeys.noValue')
                }
              />
              <ProfileListItem
                header={t('operator.profile.about.status.statusHeader')}
                paragraph={
                  // TODO check if user is active with JWT payload
                  user.address
                    ? t('operator.profile.about.status.statusActivated')
                    : t('operator.profile.about.status.statusDeactivated')
                }
              />
              <ProfileDisableButton />
              <ProfileListItem
                header={t('operator.profile.about.fee')}
                paragraph={
                  `${keysData.fee}${t('inputMasks.percentSuffix')}` ||
                  t('operator.addKeysPage.existingKeys.noValue')
                }
              />
              <ProfileListItem
                header={t('operator.profile.about.publicKey')}
                paragraph={
                  keysData.public_key ||
                  t('operator.addKeysPage.existingKeys.noValue')
                }
              />
              <ProfileListItem
                header={t('operator.profile.about.url')}
                paragraph={
                  keysData.url || t('operator.addKeysPage.existingKeys.url')
                }
              />
              <ProfileListItem
                header={t('operator.profile.about.webhookUrl')}
                paragraph={
                  keysData.webhook_url ||
                  t('operator.addKeysPage.existingKeys.noValue')
                }
              />
            </List>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={isMobile ? 12 : 4}>
        <Paper
          sx={{
            backgroundColor: colorPalette.white,
            height: '100%',
            boxShadow: 'none',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '40px',
            borderRadius: '20px',
          }}
        >
          <Typography
            color={colorPalette.text.primary}
            sx={{
              fontWeight: 600,
              width: '100%',
            }}
            variant="h5"
          >
            {t('operator.profile.statistics.header')}
          </Typography>
          <Stack flexDirection="row" justifyContent="space-between">
            <List>
              <ProfileListItem
                header={t('operator.profile.statistics.escrowsProcessed')}
                paragraph="-"
              />
              <ProfileListItem
                header={t('operator.profile.statistics.escrowsActive')}
                paragraph="-"
              />
              <ProfileListItem
                header={t('operator.profile.statistics.escrowsCancelled')}
                paragraph="-"
              />
              <ProfileListItem
                header={t('operator.profile.statistics.workersAmount')}
                paragraph={statsData.workers_total.toString()}
              />
            </List>
            <List>
              <ProfileListItem
                header={t('operator.profile.statistics.assignmentsCompleted')}
                paragraph={statsData.assignments_completed.toString()}
              />
              <ProfileListItem
                header={t('operator.profile.statistics.assignmentsRejected')}
                paragraph={statsData.assignments_rejected.toString()}
              />
              <ProfileListItem
                header={t('operator.profile.statistics.assignmentsExpired')}
                paragraph={statsData.assignments_expired.toString()}
              />
            </List>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}

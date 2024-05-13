import { useEffect } from 'react';
import { Grid, List, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useBackgroundColorStore } from '@/hooks/use-background-store';
import { colorPalette } from '@/styles/color-palette';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { ProfileListItem } from './profile-list-item';

const mockedData = {
  profile: {
    role: 'Job Launcher',
    active: true,
    fee: '10%',
    url: 'https://mywebhookurl.com',
    webhookUrl: 'https://mywebhookurl.com',
    jobTypes: ['Image Labelling', 'BBox'],
  },
  statistics: {
    escrowsProcessed: 1000,
    escrowsActive: 350,
    escrowsCancelled: 50,
    workersAmount: 500,
    assignmentsCompleted: 10000,
    assignmentsRejected: 300,
    assignmentsExpired: 100,
  },
};

export function OperatorProfilePage() {
  const { setGrayBackground } = useBackgroundColorStore();
  const { t } = useTranslation();
  const isMobile = useIsMobile('lg');

  useEffect(() => {
    setGrayBackground();
  }, [setGrayBackground]);

  return (
    <Grid container spacing={4}>
      <Grid item xs={isMobile ? 12 : 8}>
        <Paper
          sx={{
            backgroundColor: colorPalette.white,
            height: '100%',
            boxShadow: 'none',
            padding: '40px',
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
            <List>
              <ProfileListItem
                header={t('operator.profile.about.role')}
                paragraph={mockedData.profile.role}
              />
              <ProfileListItem
                header={t('operator.profile.about.status.statusHeader')}
                isStatusListItem={mockedData.profile.active}
                paragraph={
                  mockedData.profile.active
                    ? t('operator.profile.about.status.statusActivated')
                    : t('operator.profile.about.status.statusDeactivated')
                }
              />
              <ProfileListItem
                header={t('operator.profile.about.fee')}
                paragraph={mockedData.profile.fee}
              />
              <ProfileListItem
                header={t('operator.profile.about.url')}
                paragraph={mockedData.profile.url}
              />
              <ProfileListItem
                header={t('operator.profile.about.webhookUrl')}
                paragraph={mockedData.profile.webhookUrl}
              />
              <ProfileListItem
                header={t('operator.profile.about.jobTypes')}
                paragraph={mockedData.profile.jobTypes}
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
          <Stack flexDirection="row">
            <List>
              <ProfileListItem
                header={t('operator.profile.statistics.escrowsProcessed')}
                paragraph={mockedData.statistics.escrowsProcessed.toString()}
              />
              <ProfileListItem
                header={t('operator.profile.statistics.escrowsActive')}
                paragraph={mockedData.statistics.escrowsActive.toString()}
              />
              <ProfileListItem
                header={t('operator.profile.statistics.escrowsCancelled')}
                paragraph={mockedData.statistics.escrowsCancelled.toString()}
              />
              <ProfileListItem
                header={t('operator.profile.statistics.workersAmount')}
                paragraph={mockedData.statistics.workersAmount.toString()}
              />
            </List>
            <List>
              <ProfileListItem
                header={t('operator.profile.statistics.assignmentsCompleted')}
                paragraph={mockedData.statistics.assignmentsCompleted.toString()}
              />
              <ProfileListItem
                header={t('operator.profile.statistics.assignmentsRejected')}
                paragraph={mockedData.statistics.assignmentsRejected.toString()}
              />
              <ProfileListItem
                header={t('operator.profile.statistics.assignmentsExpired')}
                paragraph={mockedData.statistics.assignmentsExpired.toString()}
              />
            </List>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}

import { Paper, Typography, Stack, List } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ProfileListItem } from '@/shared/components/ui/profile';
import { useColorMode } from '@/shared/contexts/color-mode';
import { type OperatorStatsResponse } from '../types';

export function OperatorStats({
  statsData,
}: Readonly<{
  statsData: OperatorStatsResponse;
}>) {
  const { colorPalette } = useColorMode();
  const { t } = useTranslation();

  return (
    <Paper
      sx={{
        height: '100%',
        boxShadow: 'none',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: { xs: 2.5, md: 5 },
        borderRadius: '20px',
      }}
    >
      <Typography
        sx={{
          fontWeight: 600,
          width: '100%',
          color: colorPalette.text.primary,
        }}
        variant="h5"
      >
        {t('operator.profile.statistics.header')}
      </Typography>
      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        <List>
          <ProfileListItem
            header={t('operator.profile.statistics.escrowsProcessed')}
            paragraph={statsData.escrows_processed.toString()}
          />
          <ProfileListItem
            header={t('operator.profile.statistics.escrowsActive')}
            paragraph={statsData.escrows_active.toString()}
          />
          <ProfileListItem
            header={t('operator.profile.statistics.escrowsCancelled')}
            paragraph={statsData.escrows_cancelled.toString()}
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
  );
}

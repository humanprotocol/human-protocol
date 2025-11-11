import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Grid from '@mui/material/Grid';
import { useEffect } from 'react';
import { t } from 'i18next';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { getErrorMessageForError } from '@/shared/errors';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useHCaptchaUserStats } from '../hooks';
import { UserStatsDetails } from './user-stats-details';
import { LoadingOverlay } from './user-stats-loading-overlay';

const accordionWidth = { width: '284px' };

export function UserStatsAccordion() {
  const { colorPalette } = useColorMode();
  const {
    data: hcaptchaUserStats,
    isPending: isHcaptchaUserStatsPending,
    isError: isHcaptchaUserStatsError,
    error: hcaptchaUserStatsError,
    refetch: refetchUserStats,
    isRefetching: isHcaptchaUserStatsRefetching,
  } = useHCaptchaUserStats();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (isHcaptchaUserStatsError) {
      showNotification({
        type: TopNotificationType.WARNING,
        message: getErrorMessageForError(hcaptchaUserStatsError),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ...
  }, [isHcaptchaUserStatsError, hcaptchaUserStatsError]);

  return (
    <Grid sx={{ height: '76px' }}>
      <Accordion
        sx={{
          ...accordionWidth,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {isHcaptchaUserStatsRefetching && (
          <LoadingOverlay
            sx={{
              ...accordionWidth,
              height: '100%',
              top: 0,
              left: 0,
            }}
          />
        )}
        <AccordionSummary
          aria-controls="panel1-content"
          disabled={isHcaptchaUserStatsPending || isHcaptchaUserStatsError}
          expandIcon={
            <ExpandMoreIcon
              sx={{
                fill: colorPalette.text.primary,
              }}
            />
          }
          id="panel1-header"
          sx={{ ...accordionWidth, height: '76px' }}
        >
          <Typography variant="subtitle2">
            {t('worker.hcaptchaLabelingStats.statistics')}
          </Typography>
        </AccordionSummary>
        {hcaptchaUserStats ? (
          <AccordionDetails sx={{ ...accordionWidth }}>
            <UserStatsDetails
              refetch={() => void refetchUserStats()}
              stats={hcaptchaUserStats}
              isRefetching={isHcaptchaUserStatsRefetching}
            />
          </AccordionDetails>
        ) : null}
      </Accordion>
    </Grid>
  );
}

import { useEffect, useState } from 'react';
import { t } from 'i18next';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { getErrorMessageForError } from '@/shared/errors';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useHCaptchaUserStats } from '../hooks';
import { UserStatsDetails } from './user-stats-details';
import { LoadingOverlay } from './user-stats-loading-overlay';

const ACCORDION_WIDTH = '284px';
const ACCORDION_HEIGHT = '48px';

export function UserStatsAccordion() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { colorPalette } = useColorMode();
  const { showNotification } = useNotification();

  const {
    data: hcaptchaUserStats,
    isPending: isHcaptchaUserStatsPending,
    isError: isHcaptchaUserStatsError,
    error: hcaptchaUserStatsError,
    refetch: refetchUserStats,
    isRefetching: isHcaptchaUserStatsRefetching,
  } = useHCaptchaUserStats();

  useEffect(() => {
    if (isHcaptchaUserStatsError) {
      showNotification({
        type: TopNotificationType.ERROR,
        message: getErrorMessageForError(hcaptchaUserStatsError),
      });
    }
  }, [isHcaptchaUserStatsError, hcaptchaUserStatsError, showNotification]);

  return (
    <Grid sx={{ height: ACCORDION_HEIGHT }}>
      <Accordion
        expanded={isExpanded}
        onChange={(_, expanded) => {
          setIsExpanded(expanded);
        }}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          width: ACCORDION_WIDTH,
          minHeight: ACCORDION_HEIGHT,
          zIndex: 1,
        }}
      >
        {isExpanded && isHcaptchaUserStatsRefetching && (
          <LoadingOverlay
            sx={{
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
            }}
          />
        )}
        <AccordionSummary
          aria-controls="panel1-content"
          disabled={
            isHcaptchaUserStatsPending ||
            isHcaptchaUserStatsRefetching ||
            isHcaptchaUserStatsError
          }
          expandIcon={
            <ExpandMoreIcon
              sx={{
                fill: colorPalette.text.primary,
              }}
            />
          }
          id="panel1-header"
          sx={{
            width: ACCORDION_WIDTH,
            height: ACCORDION_HEIGHT,
            py: 1.5,
            '& > .MuiAccordionSummary-content': {
              m: 0,
            },
            '&.Mui-expanded': { minHeight: ACCORDION_HEIGHT },
          }}
        >
          <Typography variant="subtitle2">
            {t('worker.hcaptchaLabelingStats.statistics')}
          </Typography>
        </AccordionSummary>
        {hcaptchaUserStats ? (
          <AccordionDetails sx={{ width: ACCORDION_WIDTH }}>
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

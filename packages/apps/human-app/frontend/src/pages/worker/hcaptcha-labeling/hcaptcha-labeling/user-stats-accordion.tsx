import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Grid from '@mui/material/Grid';
import { useEffect } from 'react';
import { UserStatsDetails } from '@/pages/worker/hcaptcha-labeling/hcaptcha-labeling/user-stats-details';
import { useHCaptchaUserStats } from '@/api/servieces/worker/hcaptcha-user-stats';
import { useProtectedLayoutNotification } from '@/hooks/use-protected-layout-notifications';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';

const accordionWidth = { width: '284px' };

export function UserStatsAccordion() {
  const {
    data: hcaptchaUserStats,
    isPending: isHcaptchaUserStatsPending,
    isError: isHcaptchaUserStatsError,
    error: hcaptchaUserStatsError,
    refetch: refetchUserStats,
  } = useHCaptchaUserStats();
  const { setTopNotification } = useProtectedLayoutNotification();

  useEffect(() => {
    if (isHcaptchaUserStatsError) {
      setTopNotification({
        type: 'warning',
        content: defaultErrorMessage(hcaptchaUserStatsError),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ...
  }, [isHcaptchaUserStatsError, hcaptchaUserStatsError]);

  return (
    <Grid sx={{ height: '76px' }}>
      <Accordion sx={{ ...accordionWidth }}>
        <AccordionSummary
          aria-controls="panel1-content"
          disabled={isHcaptchaUserStatsPending || isHcaptchaUserStatsError}
          expandIcon={<ExpandMoreIcon />}
          id="panel1-header"
          sx={{ ...accordionWidth, height: '76px' }}
        >
          <Typography variant="subtitle2">hCapcha Statistics</Typography>
        </AccordionSummary>
        {hcaptchaUserStats ? (
          <AccordionDetails sx={{ ...accordionWidth }}>
            <UserStatsDetails
              refetch={() => {
                void refetchUserStats();
              }}
              stats={hcaptchaUserStats}
            />
          </AccordionDetails>
        ) : null}
      </Accordion>
    </Grid>
  );
}

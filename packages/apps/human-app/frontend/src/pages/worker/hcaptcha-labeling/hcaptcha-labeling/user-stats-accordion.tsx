import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Grid from '@mui/material/Grid';
import { UserStatsDetails } from '@/pages/worker/hcaptcha-labeling/hcaptcha-labeling/user-stats-details';

const accordionWidth = { width: '284px' };

export function UserStatsAccordion() {
  return (
    <Grid sx={{ height: '76px' }}>
      <Accordion sx={{ ...accordionWidth }}>
        <AccordionSummary
          aria-controls="panel1-content"
          expandIcon={<ExpandMoreIcon />}
          id="panel1-header"
          sx={{ ...accordionWidth, height: '76px' }}
        >
          <Typography variant="subtitle2">hCapcha Statistics</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ ...accordionWidth }}>
          <UserStatsDetails />
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}

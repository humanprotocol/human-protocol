import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import { breakpoints } from '@/styles/theme';

export function Buttons({ openForm }: { openForm: () => void }) {
  return (
    <Grid
      container
      gap="1rem"
      sx={{
        flex: '1',
        flexWrap: 'nowrap',
        [breakpoints.mobile]: {
          flexWrap: 'wrap',
        },
      }}
    >
      <Button
        fullWidth
        onClick={() => {
          openForm();
        }}
        variant="contained"
      >
        {t('operator.addStake.actionBtn')}
      </Button>
      <Button component={Link} fullWidth to="/next-page" variant="outlined">
        {t('operator.addStake.nextBtn')}
      </Button>
    </Grid>
  );
}

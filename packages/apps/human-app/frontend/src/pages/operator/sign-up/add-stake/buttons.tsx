import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import { breakpoints } from '@/styles/theme';
import { routerPaths } from '@/router/router-paths';

export function Buttons({
  openForm,
  stakedAmount,
}: {
  openForm: () => void;
  stakedAmount?: bigint;
}) {
  const isStaked = stakedAmount ? stakedAmount > BigInt(0) : false;
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
      <Button
        component={Link}
        fullWidth
        to={routerPaths.operator.addKeys}
        variant="outlined"
      >
        {isStaked
          ? t('operator.addStake.nextBtn')
          : t('operator.addStake.skipBtn')}
      </Button>
    </Grid>
  );
}

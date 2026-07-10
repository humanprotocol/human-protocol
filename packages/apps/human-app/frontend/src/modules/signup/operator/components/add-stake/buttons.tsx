import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import { breakpoints } from '@/shared/styles/breakpoints';
import { routerPaths } from '@/router/router-paths';

export function Buttons({
  openForm,
  stakedAmount,
}: Readonly<{
  openForm: () => void;
  stakedAmount?: bigint;
}>) {
  const isStaked = stakedAmount ? stakedAmount > BigInt(0) : false;
  return (
    <Grid
      container
      sx={{
        flex: 1,
        gap: 2,
        flexWrap: 'nowrap',
        [breakpoints.mobile]: {
          flexWrap: 'wrap',
        },
      }}
    >
      <Button
        variant="contained"
        fullWidth
        onClick={() => {
          openForm();
        }}
      >
        {t('operator.addStake.actionBtn')}
      </Button>
      <Button
        component={Link}
        to={routerPaths.operator.addKeys}
        variant="outlined"
        fullWidth
      >
        {isStaked
          ? t('operator.addStake.nextBtn')
          : t('operator.addStake.skipBtn')}
      </Button>
    </Grid>
  );
}

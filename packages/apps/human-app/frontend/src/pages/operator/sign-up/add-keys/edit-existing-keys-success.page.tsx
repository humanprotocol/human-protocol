import { t } from 'i18next';
import { Grid, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { PageCard } from '@/components/ui/page-card';
import { Button } from '@/components/ui/button';
import { routerPaths } from '@/router/router-paths';

export function EditExistingKeysSuccessPage() {
  return (
    <PageCard title={t('operator.editExistingKeysSuccess.title')}>
      <Grid container gap="2rem" marginTop="2rem">
        <Grid>
          <Typography variant="subtitle1">
            {t('operator.editExistingKeysSuccess.paragraph1')}
          </Typography>
          <Typography variant="subtitle1">
            {t('operator.editExistingKeysSuccess.paragraph2')}
          </Typography>
        </Grid>
        <Button
          component={Link}
          fullWidth
          to={routerPaths.homePage}
          variant="contained"
        >
          {t('operator.editExistingKeysSuccess.btn')}
        </Button>
      </Grid>
    </PageCard>
  );
}

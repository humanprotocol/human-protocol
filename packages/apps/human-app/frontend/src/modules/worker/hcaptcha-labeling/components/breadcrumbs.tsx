import { Box, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { t } from 'i18next';

import { routerPaths } from '@/router/router-paths';

export function Breadcrumbs() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Link
        component={RouterLink}
        to={routerPaths.jobsDiscovery}
        variant="body1"
        sx={{
          color: 'text.auxiliary200',
          fontWeight: 500,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        }}
      >
        {t('worker.jobs.availableJobs')}
      </Link>
      <Typography
        variant="body1"
        sx={{ color: 'text.auxiliary200', fontWeight: 500 }}
      >
        {'>'}
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: 'text.primary', fontWeight: 700 }}
      >
        {t('worker.jobs.hCaptcha')}
      </Typography>
    </Box>
  );
}

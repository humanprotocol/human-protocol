import { t } from 'i18next';
import { Link } from 'react-router-dom';
import { Paper, Stack, Typography } from '@mui/material';

import { Button } from '@/shared/components/ui/button';
import { SuccessIcon } from '@/shared/components/ui/icons';
import { routerPaths } from '@/router/router-paths';

export function EmailVerificationSuccessMessage() {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flex: 1,
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        my: { xs: 0, md: 4 },
        borderRadius: '30px',
        borderBottomLeftRadius: { xs: 0, md: '30px' },
        borderBottomRightRadius: { xs: 0, md: '30px' },
        border: { xs: 'none', md: '1px solid' },
        borderColor: (theme) => ({
          xs: 'none',
          md: theme.palette.border.main,
        }),
      }}
    >
      <Stack sx={{ gap: 2.5, alignItems: 'center' }}>
        <SuccessIcon sx={{ fontSize: { xs: 56, md: 72 } }} />
        <Typography
          variant="body1"
          sx={{
            color: 'text.primary',
            fontWeight: 600,
          }}
        >
          {t('worker.emailVerification.title')}
        </Typography>
        <Button
          component={Link}
          to={routerPaths.signIn}
          variant="contained"
          color="accent"
          fullWidth
          sx={{ width: '200px' }}
        >
          {t('worker.emailVerification.btn')}
        </Button>
      </Stack>
    </Paper>
  );
}

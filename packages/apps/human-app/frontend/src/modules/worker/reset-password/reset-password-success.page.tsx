import { useEffect } from 'react';
import { Paper, Stack, Typography } from '@mui/material';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import CheckCircle from '@mui/icons-material/CheckCircle';

import { Button } from '@/shared/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { useColorMode } from '@/shared/contexts/color-mode';

export function ResetPasswordWorkerSuccessPage() {
  const { colorPalette } = useColorMode();
  const { signOut } = useAuth();

  useEffect(() => {
    signOut();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flex: 1,
        alignSelf: 'stretch',
        justifyContent: 'center',
        alignItems: 'center',
        my: { xs: 0, md: 4 },
        py: { xs: 3, md: 0 },
        px: { xs: 2, md: 0 },
        bgcolor: colorPalette.background.paper,
        borderRadius: '30px',
        borderBottomLeftRadius: { xs: 0, md: '30px' },
        borderBottomRightRadius: { xs: 0, md: '30px' },
        border: { xs: 'none', md: '1px solid' },
        borderColor: {
          xs: 'none',
          md: colorPalette.border.main,
        },
        overflow: 'hidden',
      }}
    >
      <Stack
        sx={{
          width: { xs: '100%', md: '400px' },
          gap: 3,
          alignItems: { xs: 'flex-start', md: 'center' },
        }}
      >
        <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
          <CheckCircle
            fontSize="large"
            sx={{ fill: colorPalette.success.main }}
          />
          <Typography
            component="h3"
            variant="h6"
            sx={{ color: colorPalette.text.auxiliary100 }}
          >
            {t('worker.resetPasswordSuccess.title')}
          </Typography>
        </Stack>
        <Stack sx={{ gap: 3 }}>
          <Typography
            variant="body1"
            sx={{ color: colorPalette.text.auxiliary100 }}
          >
            {t('worker.resetPasswordSuccess.description')}
          </Typography>
          <Button
            component={Link}
            to={routerPaths.worker.signIn}
            variant="contained"
            color="accent"
            fullWidth
          >
            {t('worker.resetPasswordSuccess.btn')}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

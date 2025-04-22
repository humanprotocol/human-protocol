import { t } from 'i18next';
import { Grid, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import { breakpoints } from '@/shared/styles/breakpoints';
import { useModal } from '@/shared/contexts/modal-context';

export function ExpirationModal() {
  const { closeModal } = useModal();
  const navigate = useNavigate();

  return (
    <Grid
      container
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: '124px',
        [breakpoints.mobile]: {
          padding: '32px',
        },
      }}
    >
      <Grid
        container
        sx={{
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '20px',
          flexDirection: 'column',
          maxWidth: '352px',
        }}
      >
        <Typography variant="h4">{t('expirationModal.header')}</Typography>
        <Grid
          container
          sx={{
            justifyContent: 'center',
            alignItems: 'flex-start',
            flexDirection: 'column',
            gap: '38px',
          }}
        >
          <Typography variant="body1">
            {t('expirationModal.description')}
          </Typography>
          <Button
            fullWidth
            onClick={() => {
              browserAuthProvider.signOut();

              if (browserAuthProvider.authType === 'web2') {
                navigate(routerPaths.worker.signIn, { replace: true });
              } else {
                navigate(routerPaths.homePage, { replace: true });
              }
              closeModal();
            }}
            variant="contained"
          >
            {t('expirationModal.logIn')}
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
}

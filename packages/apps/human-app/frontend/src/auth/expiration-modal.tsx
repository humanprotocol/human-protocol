import { t } from 'i18next';
import { Grid, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useModalStore } from '@/components/ui/modal/modal.store';
import { routerPaths } from '@/router/router-paths';
import { browserAuthProvider } from '@/shared/helpers/browser-auth-provider';
import { breakpoints } from '@/styles/breakpoints';
import { useAuth } from '@/auth/use-auth';
import { useWeb3Auth } from '@/auth-web3/use-web3-auth';

export function ExpirationModal() {
  const { signOut } = useAuth();
  const { signOut: web3SignOut } = useWeb3Auth();
  const { closeModal } = useModalStore();
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
              if (browserAuthProvider.authType === 'web2') {
                signOut();
                navigate(routerPaths.worker.signIn, { replace: true });
              } else {
                web3SignOut();
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

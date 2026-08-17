import { t } from 'i18next';
import { Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/shared/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import { useModal } from '@/shared/contexts/modal-context';

export function ExpirationModal() {
  const { closeModal } = useModal();
  const navigate = useNavigate();

  const handleOnSignInClick = () => {
    browserAuthProvider.signOut();
    navigate(routerPaths.signIn, { replace: true });
    closeModal();
  };

  return (
    <Stack
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, md: 15 },
      }}
    >
      <Stack
        sx={{
          justifyContent: 'center',
          gap: 2.5,
          maxWidth: '352px',
        }}
      >
        <Typography variant="h4" sx={{ color: 'text.auxiliary100' }}>
          {t('expirationModal.header')}
        </Typography>
        <Stack sx={{ gap: 5 }}>
          <Typography sx={{ color: 'text.auxiliary100' }}>
            {t('expirationModal.description')}
          </Typography>
          <Button
            variant="contained"
            color="accent"
            fullWidth
            onClick={handleOnSignInClick}
          >
            {t('expirationModal.logIn')}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}

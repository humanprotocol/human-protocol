import { Grid, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useModalStore } from '@/components/ui/modal/modal.store';
import { Button } from '@/components/ui/button';
import { breakpoints } from '@/styles/breakpoints';

export function UpdateVersionModal() {
  const { closeModal } = useModalStore();
  const { t } = useTranslation();

  return (
    <Grid
      container
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: '50px',
        [breakpoints.mobile]: {
          padding: '20px',
        },
      }}
    >
      <Grid
        container
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: '20px',
          maxWidth: '600px',
          width: '100%',
        }}
      >
        <Typography textAlign="center" variant="h4">
          {t('updateVersionModal.newVersion')}
        </Typography>
        <Typography variant="body1">
          {t('updateVersionModal.please')}
          <ol>
            <li>
              <Link
                style={{ textDecoration: 'none', fontWeight: 600 }}
                to="https://docs.humanprotocol.org/hub/human-tech-docs/tutorials/workers/sign-up"
              >
                {t('updateVersionModal.reregister')}
              </Link>
            </li>
            <li>
              <Link
                style={{ textDecoration: 'none', fontWeight: 600 }}
                to="https://docs.humanprotocol.org/hub/human-tech-docs/tutorials/workers/kyc-verification"
              >
                {t('updateVersionModal.verify')}
              </Link>
            </li>
            <li>
              <Link
                style={{ textDecoration: 'none', fontWeight: 600 }}
                to="https://docs.humanprotocol.org/hub/human-tech-docs/tutorials/workers/wallet-address-registration"
              >
                {t('updateVersionModal.connect')}
              </Link>
            </li>
          </ol>
          {t('updateVersionModal.assistance')}
          <Link
            style={{ textDecoration: 'none', fontWeight: 600 }}
            to="https://discord.com/invite/5sHfvE8y8p"
          >
            {t('updateVersionModal.discord')}
          </Link>
        </Typography>
        <Button
          fullWidth
          onClick={() => {
            sessionStorage.setItem('modalUpdateVersionShown', 'true');
            closeModal();
          }}
          variant="contained"
        >
          {t('updateVersionModal.gotIt')}
        </Button>
      </Grid>
    </Grid>
  );
}

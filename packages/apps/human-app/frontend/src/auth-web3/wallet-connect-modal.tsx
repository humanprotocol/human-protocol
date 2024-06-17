import { t } from 'i18next';
import { Grid, Typography } from '@mui/material';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ConnectWalletBtn } from '@/components/ui/connect-wallet-btn';
import { useModalStore } from '@/components/ui/modal/modal.store';
import { env } from '@/shared/env';

export function WalletConnectModal() {
  const { closeModal } = useModalStore();
  return (
    <Grid
      container
      sx={{ justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}
    >
      <Grid
        container
        sx={{
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '42px',
          flexDirection: 'column',
          maxWidth: '352px',
        }}
      >
        <Typography variant="h4">{t('walletConnectModal.header')}</Typography>
        <Grid
          container
          sx={{
            justifyContent: 'center',
            alignItems: 'flex-start',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <Typography variant="body1">
            <Trans
              components={{
                1: (
                  <Link
                    rel="noreferrer"
                    target="_blank"
                    to={env.VITE_HUMAN_PROTOCOL_HELP_URL}
                  />
                ),
              }}
              i18nKey="walletConnectModal.paragraph"
            />
          </Typography>
          <ConnectWalletBtn fullWidth>
            {t('walletConnectModal.connectBtn')}
          </ConnectWalletBtn>
          <Button
            fullWidth
            onClick={() => {
              closeModal();
            }}
            variant="outlined"
          >
            {t('walletConnectModal.cancelBtn')}
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
}

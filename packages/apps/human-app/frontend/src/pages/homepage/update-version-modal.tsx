import { Grid, Typography } from '@mui/material';
import { useModalStore } from '@/components/ui/modal/modal.store';
import { Button } from '@/components/ui/button';
import { breakpoints } from '@/styles/theme';

export function UpdateVersionModal() {
  const { closeModal } = useModalStore();

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
          We&#39;ve just released a new version of HUMAN App with enhanced
          features.
        </Typography>
        <Typography variant="body1">
          To continue using the app, please:
          <ol>
            <li>
              <a
                href="https://docs.humanprotocol.org/hub/human-tech-docs/tutorials/workers/sign-up"
                rel="noopener noreferrer"
                target="_blank"
              >
                Reregister your account
              </a>
            </li>
            <li>
              <a
                href="https://docs.humanprotocol.org/hub/human-tech-docs/tutorials/workers/kyc-verification"
                rel="noopener noreferrer"
                target="_blank"
              >
                Verify your identity
              </a>
            </li>
            <li>
              <a
                href="https://docs.humanprotocol.org/hub/human-tech-docs/tutorials/workers/wallet-address-registration"
                rel="noopener noreferrer"
                target="_blank"
              >
                Connect your wallet
              </a>
            </li>
          </ol>
          These steps help us ensure the safety of your account and provide you
          with a better experience. Thank you for your understanding! For
          assistance, reach out on&nbsp;
          <a
            href="https://discord.com/invite/5sHfvE8y8p"
            rel="noopener noreferrer"
            target="_blank"
          >
            Discord
          </a>
        </Typography>
        <Button
          fullWidth
          onClick={() => {
            sessionStorage.setItem('modalUpdateVersionShown', 'true');
            closeModal();
          }}
          variant="contained"
        >
          Got it!
        </Button>
      </Grid>
    </Grid>
  );
}

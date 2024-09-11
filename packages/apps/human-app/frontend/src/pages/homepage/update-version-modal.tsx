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
              If you don&#39;t have a wallet yet, &nbsp;
              <a
                href="https://docs.google.com/presentation/d/1rtOGNhWLcSWhIA3b-EIDObCvOAjQmXsRQL1gpT2bbqA"
                rel="noopener noreferrer"
                target="_blank"
              >
                create one
              </a>
              .
            </li>
            <li>
              <a
                href="https://docs.humanprotocol.org/hub/human-tech-docs/tutorials/workers/sign-up"
                rel="noopener noreferrer"
                target="_blank"
              >
                Re-register your account
              </a>
              .
            </li>
            <li>
              <a
                href="https://docs.humanprotocol.org/hub/human-tech-docs/tutorials/workers/kyc-verification"
                rel="noopener noreferrer"
                target="_blank"
              >
                Complete the KYC
              </a>
              (Know Your Customer) verification process.
            </li>
            <li>
              <a
                href="https://docs.humanprotocol.org/hub/human-tech-docs/tutorials/workers/wallet-address-registration"
                rel="noopener noreferrer"
                target="_blank"
              >
                Associate your wallet
              </a>
              &nbsp;with your account.
            </li>
          </ol>
          This helps us ensure the safety of your information and provide you
          with a better experience. Thank you for your understanding!
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

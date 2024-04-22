import Grid from '@mui/material/Grid';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { Alert } from '@/components/ui/alert';

export function EmailVerificationWorkerErrorPage(props: { error: unknown }) {
  return (
    <Grid container sx={{ justifyContent: 'center', alignItems: 'center' }}>
      <Alert color="error" severity="error">
        {defaultErrorMessage(props.error)}
      </Alert>
    </Grid>
  );
}

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CancelIcon from '@mui/icons-material/Cancel';

interface ErrorLabelProps {
  children: string | React.ReactElement;
}

export function ErrorLabel({ children }: ErrorLabelProps) {
  if (typeof children === 'string') {
    return (
      <Grid alignItems="center" container gap="0.5rem" padding="0.5rem 0">
        <Typography variant="buttonLarge">{children}</Typography>
        <CancelIcon color="error" fontSize="small" />
      </Grid>
    );
  }

  return children;
}

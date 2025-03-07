import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { CheckmarkIcon } from '@/shared/components/ui/icons';

interface DoneLabelProps {
  children: string | React.ReactElement;
}

export function DoneLabel({ children }: Readonly<DoneLabelProps>) {
  if (typeof children === 'string') {
    return (
      <Grid alignItems="center" container gap="0.5rem" padding="0.5rem 0">
        <Typography variant="buttonLarge">{children}</Typography>
        <CheckmarkIcon />
      </Grid>
    );
  }

  return children;
}

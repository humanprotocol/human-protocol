import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { CheckmarkIcon } from '@/components/ui/icons';

interface ProfileActionProps {
  done: boolean;
  doneLabel: string;
  toDoComponent: React.ReactElement;
}

export function ProfileAction({
  done,
  doneLabel,
  toDoComponent,
}: ProfileActionProps) {
  if (done) {
    return (
      <Grid alignItems="center" container gap="0.5rem" padding="0.5rem 0">
        <Typography variant="buttonLarge">{doneLabel}</Typography>
        <CheckmarkIcon />
      </Grid>
    );
  }

  return toDoComponent;
}

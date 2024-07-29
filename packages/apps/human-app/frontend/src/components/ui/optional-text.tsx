import Grid from '@mui/material/Grid';
import { EmptyPlaceholder } from '@/components/ui/empty-placeholder';

export function OptionalText({ text }: { text?: string }) {
  if (!text) {
    return <EmptyPlaceholder />;
  }

  return (
    <Grid sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }} width="100%">
      {text}
    </Grid>
  );
}

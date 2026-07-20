import Grid from '@mui/material/Grid';
import { EmptyPlaceholder } from '@/shared/components/ui/empty-placeholder';

export function OptionalText({ text }: { text?: string }) {
  if (!text) {
    return <EmptyPlaceholder />;
  }

  return (
    <Grid sx={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {text}
    </Grid>
  );
}

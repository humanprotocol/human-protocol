import Grid from '@mui/material/Grid/Grid';
import { FilersIcon } from '@/components/ui/icons';

export function FilterHeader({ text }: { text: string }) {
  return (
    <Grid
      container
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'nowrap',
        gap: '0.5rem',
      }}
    >
      <span>{text}</span>
      <FilersIcon />
    </Grid>
  );
}

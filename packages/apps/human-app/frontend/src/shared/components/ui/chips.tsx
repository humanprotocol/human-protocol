import { Grid } from '@mui/material';
import { Chip } from '@/shared/components/ui/chip';

interface ChipsProps {
  data: string[];
}

export function Chips({ data }: ChipsProps) {
  return (
    <Grid container sx={{ flexWrap: 'wrap', gap: '0.5rem' }}>
      {data.map((chipLabel) => (
        <Chip key={chipLabel} label={chipLabel} />
      ))}
    </Grid>
  );
}

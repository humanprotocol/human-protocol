import { Grid } from '@mui/material';
import { Chip } from '@/components/ui/chip';

interface ChipsProps {
  data: string[];
}

export function Chips({ data }: ChipsProps) {
  return (
    <Grid container sx={{ flexWrap: 'wrap', gap: '0.5rem' }}>
      {data.map((chipLabel) => (
        <Chip key={crypto.randomUUID()} label={chipLabel} />
      ))}
    </Grid>
  );
}

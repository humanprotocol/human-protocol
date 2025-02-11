import { Grid } from '@mui/material';
import { useColorMode } from '@/shared/contexts/color-mode';

export function NoRecords() {
  const { colorPalette } = useColorMode();

  return (
    <Grid
      sx={{
        padding: '20px',
        textAlign: 'center',
        fontStyle: 'italic',
        color: colorPalette.text.secondary,
      }}
    >
      <span>No records to display</span>
    </Grid>
  );
}

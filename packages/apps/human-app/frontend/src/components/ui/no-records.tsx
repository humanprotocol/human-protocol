import { Grid } from '@mui/material';
import { darkColorPalette } from '@/styles/dark-color-palette';
import { useColorMode } from '@/hooks/use-color-mode';
import { colorPalette } from '@/styles/color-palette';

export function NoRecords() {
  const { isDarkMode } = useColorMode();

  return (
    <Grid
      sx={{
        padding: '20px',
        textAlign: 'center',
        fontStyle: 'italic',
        color: isDarkMode
          ? darkColorPalette.text.disabled
          : colorPalette.text.secondary,
      }}
    >
      <span>No records to display</span>
    </Grid>
  );
}

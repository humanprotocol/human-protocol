import { Grid, Switch } from '@mui/material';
import { MoonIcon, SunIcon } from '@/components/ui/icons';
import { useColorMode } from '@/hooks/use-color-mode';

export function DarkModeSwitch() {
  const { switchMode, isDarkMode } = useColorMode();
  return (
    <Grid
      container
      sx={{
        width: '100%',
        gap: '0.5rem',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <SunIcon />
      <Switch
        checked={isDarkMode}
        onChange={() => {
          switchMode();
        }}
      />
      <MoonIcon />
    </Grid>
  );
}

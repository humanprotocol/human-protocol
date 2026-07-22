import { Box, IconButton } from '@mui/material';
import { MoonIcon, SunIcon } from '@/shared/components/ui/icons';
import { useColorMode } from '@/shared/contexts/color-mode';

export function ColorModeSwitch() {
  const { switchMode, colorPalette, isDarkMode } = useColorMode();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '32px',
        p: '3px',
        gap: 1,
        borderRadius: '90px',
        border: '1px solid',
        borderColor: colorPalette.border.main,
        bgcolor: isDarkMode ? '#2d284e' : '#ffffff',
      }}
    >
      <IconButton
        disableRipple
        sx={{
          py: 0.5,
          px: 1,
          borderRadius: '90px',
          bgcolor: isDarkMode ? 'transparent' : '#fa2a75',
        }}
        onClick={() => {
          if (isDarkMode) switchMode();
        }}
      >
        <SunIcon />
      </IconButton>
      <IconButton
        disableRipple
        sx={{
          py: 0.5,
          px: 1,
          borderRadius: '90px',
          bgcolor: isDarkMode ? '#fa2a75' : 'transparent',
        }}
        onClick={() => {
          if (!isDarkMode) switchMode();
        }}
      >
        <MoonIcon />
      </IconButton>
    </Box>
  );
}

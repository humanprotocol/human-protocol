import { Box, IconButton } from '@mui/material';
import { MoonIcon, SunIcon } from '@/shared/components/ui/icons';
import { useColorMode } from '@/shared/contexts/color-mode';

export function ColorModeSwitch() {
  const { switchMode, isDarkMode } = useColorMode();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '32px',
        p: '3px',
        gap: 1,
        bgcolor: 'background.subtle',
        borderRadius: '90px',
        border: '1px solid',
        borderColor: 'border.main',
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
        onClick={switchMode}
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
        onClick={switchMode}
      >
        <MoonIcon />
      </IconButton>
    </Box>
  );
}

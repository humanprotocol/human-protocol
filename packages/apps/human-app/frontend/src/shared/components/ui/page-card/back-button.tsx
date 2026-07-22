import { IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useColorMode } from '@/shared/contexts/color-mode';

export function BackButton({ onClick }: { onClick: () => void }) {
  const { isDarkMode, colorPalette } = useColorMode();

  return (
    <IconButton
      onClick={onClick}
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        width: { xs: '32px', md: '40px' },
        height: { xs: '32px', md: '40px' },
        borderRadius: '50%',
        fontSize: '24px',
        color: isDarkMode
          ? colorPalette.text.auxiliary100
          : colorPalette.text.primary,
        bgcolor: colorPalette.background.default,
        '&:hover': {
          bgcolor: colorPalette.background.default,
        },
      }}
    >
      <ArrowBackIcon fontSize="inherit" />
    </IconButton>
  );
}

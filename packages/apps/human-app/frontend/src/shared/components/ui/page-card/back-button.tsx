import { IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useColorMode } from '@/shared/contexts/color-mode';

export function BackButton({ onClick }: { onClick: () => void }) {
  const { isDarkMode } = useColorMode();

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
        transition: 'none',
        color: isDarkMode ? 'text.auxiliary100' : 'text.primary',
        bgcolor: 'background.default',
        '&:hover': {
          bgcolor: 'background.default',
        },
      }}
    >
      <ArrowBackIcon fontSize="inherit" />
    </IconButton>
  );
}

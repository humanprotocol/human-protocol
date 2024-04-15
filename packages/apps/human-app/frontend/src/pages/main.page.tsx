import Box from '@mui/material/Box';
import { Paper } from '@mui/material';
import { colorPalette } from '@/styles/color-palette';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { SignUpPage } from './homepage/signup.page';

export function MainPage() {
  const isMobile = useIsMobile('xl');

  return (
    <Box>
      <Paper
        sx={{
          backgroundColor: colorPalette.white,
          py: !isMobile ? '200px' : 0,
          px: !isMobile ? '150px' : 0,
          boxShadow: 'none',
          borderRadius: '20px',
          position: 'relative',
        }}
      >
        <SignUpPage />
      </Paper>
    </Box>
  );
}

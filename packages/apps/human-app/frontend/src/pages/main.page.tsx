import Box from '@mui/material/Box';
import { Paper } from '@mui/material';
import { colorPalette } from '@/styles/color-palette';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { SignUpPage } from './homepage/signup.page';

export function MainPage() {
  const isMobile = useIsMobile();

  return (
    <Box>
      <Paper
        sx={{
          backgroundColor: colorPalette.white,
          py: !isMobile ? '100px' : 0,
          mx: !isMobile ? '30px' : 0,
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

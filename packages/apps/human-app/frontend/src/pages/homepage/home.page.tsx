import Box from '@mui/material/Box';
import { Paper } from '@mui/material';
import { colorPalette } from '@/styles/color-palette';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { HomeContainer } from './components/home-container';

export function HomePage() {
  const isMobile = useIsMobile();

  return (
    <Box width="100%">
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
        <HomeContainer />
      </Paper>
    </Box>
  );
}

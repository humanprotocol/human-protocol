import Box from '@mui/material/Box';
import { Paper } from '@mui/material';
import { useState } from 'react';
import { Layout } from '@/components/layout/unprotected/layout';
import { colorPalette } from '@/styles/color-palette';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { SignUpPage } from './homepage/signup.page';

export function MainPage() {
  const [isGreyBackground, setIsGreyBackground] = useState(true);
  const isMobile = useIsMobile();

  return (
    <Box>
      <Layout
        backgroundColor={
          !isMobile && isGreyBackground
            ? colorPalette.paper.main
            : colorPalette.white
        }
      >
        <Paper
          sx={{
            backgroundColor: colorPalette.white,
            py: '250px',
            px: '150px',
            boxShadow: 'none',
            borderRadius: '20px',
            position: 'relative',
          }}
        >
          <SignUpPage setIsGreyBackground={setIsGreyBackground} />
        </Paper>
      </Layout>
    </Box>
  );
}

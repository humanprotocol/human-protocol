import { Box, styled } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { AuthFooter } from '../components/Footer/AuthFooter';
import { AuthHeader } from '../components/Headers/AuthHeader';

const PageContainer = styled('div')({
  padding: '40px',
  marginTop: '25px',
  marginLeft: '26px',
  overflow: 'auto', // In case content exceeds the height, it will be scrollable
  backgroundColor: '#F6F7FE',
  borderRadius: '30px',
});

export default function AuthLayout() {
  return (
    <Box sx={{ display: 'flex' }}>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: 4,
          minHeight: '100vh',
          background: '#FFF',
        }}
      >
        <AuthHeader />
        <Box sx={{ pt: 11, pb: 2 }}>
          <PageContainer>
            <Outlet />
          </PageContainer>
        </Box>
        <AuthFooter />
      </Box>
    </Box>
  );
}

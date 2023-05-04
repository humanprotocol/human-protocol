import { Box, Typography } from '@mui/material';
import {
  useWeb3ModalTheme,
  Web3Modal,
  Web3NetworkSwitch,
} from '@web3modal/react';
import { useAccount } from 'wagmi';

import { Escrow } from './components/Escrow';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ethereumClient, projectId } from './connectors/connectors';

function App() {
  const { setTheme } = useWeb3ModalTheme();
  const { isConnected } = useAccount();

  setTheme({
    themeMode: 'light',
    themeVariables: {
      '--w3m-accent-color': 'purple',
    },
  });

  return (
    <>
      <Header />
      <Box sx={{ px: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }, pt: 12 }}>
        <Box
          sx={{
            background: '#f6f7fe',
            borderRadius: {
              xs: '16px',
              sm: '16px',
              md: '24px',
              lg: '32px',
              xl: '40px',
            },
            padding: {
              xs: '24px 16px',
              md: '42px 54px',
              lg: '56px 72px',
              xl: '70px 90px',
            },
          }}
        >
          {!isConnected && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Typography variant="h4" fontWeight={600} gutterBottom>
                Select Network
              </Typography>
              <Web3NetworkSwitch />
            </Box>
          )}
          {isConnected && <Escrow />}
        </Box>
      </Box>
      <Footer />
      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
    </>
  );
}

export default App;

import * as React from 'react';
import { Box } from '@mui/material';
import Footer from './Footer';
import Header from './Header';
import '@rainbow-me/rainbowkit/styles.css';
import {
    getDefaultWallets,
    RainbowKitProvider,
    lightTheme
} from '@rainbow-me/rainbowkit';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { mainnet, polygon,polygonMumbai} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
const { chains, provider } = configureChains(
        [mainnet, polygon,polygonMumbai],
        [

            publicProvider()
        ]
        );

const { connectors } = getDefaultWallets({
    appName: 'Kv Store',
    chains
});

const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider
})
interface ILayout {
  children: React.ReactNode;
}

const Layout: React.FC<ILayout> = ({ children }): React.ReactElement => (
  <Box
    sx={{
      marginTop: '110px',
    }}
  >
      <WagmiConfig client={wagmiClient}>
          <RainbowKitProvider

              chains={chains}
              modalSize="compact"
              initialChain={polygonMumbai}
              >
              <Header />
              {children}
              <Footer />
          </RainbowKitProvider>
      </WagmiConfig>

  </Box>
);

export default Layout;

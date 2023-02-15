import * as React from 'react';
import { Box } from '@mui/material';
import Footer from './Footer';
import Header from './Header';
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { ESCROW_NETWORKS, ChainId } from '../constants';
const chain = Object.values(ESCROW_NETWORKS)
  .filter(({ chainId }) => chainId !== ChainId.RINKEBY)
  .map(({ wagmiChain }) => wagmiChain);
const rpcUrls = Object.values(ESCROW_NETWORKS)
  .filter(({ chainId }) => chainId !== ChainId.RINKEBY)
  .map(({ rpcUrl }) =>
    jsonRpcProvider({
      rpc: (chain) => ({
        http: rpcUrl,
      }),
    })
  );
const { chains, provider } = configureChains(chain, [
  publicProvider(),
  ...rpcUrls,
]);

const { connectors } = getDefaultWallets({
  appName: 'Kv Store',
  chains,
});

const wagmiClient = createClient({
  connectors,
  provider,
});

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
      <RainbowKitProvider chains={chains} modalSize="compact">
        <Header />
        {children}
        <Footer />
      </RainbowKitProvider>
    </WagmiConfig>
  </Box>
);

export default Layout;

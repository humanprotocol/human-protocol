import * as React from "react";
import { Box } from "@mui/material";
import Footer from "./Footer";
import Header from "./Header";
import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultWallets,
  RainbowKitProvider
} from "@rainbow-me/rainbowkit";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { polygonMumbai } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { alchemyProvider } from "wagmi/providers/alchemy";

const { chains, provider } = configureChains(
  [polygonMumbai],
  [publicProvider(),
    alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_API_KEY as string })]
);

const { connectors } = getDefaultWallets({
  appName: "Kv Store",
  chains
});

const wagmiClient = createClient({
  connectors,
  provider
});

interface ILayout {
  children: React.ReactNode;
}

const Layout: React.FC<ILayout> = ({ children }): React.ReactElement => (
  <Box
    sx={{
      marginTop: "110px"
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

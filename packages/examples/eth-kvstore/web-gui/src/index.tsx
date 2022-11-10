import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import {
  RainbowKitProvider,
  getDefaultWallets,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import "./styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";

const { chains, provider } = configureChains(
  [chain.polygonMumbai, chain.localhost,chain.mainnet,chain.ropsten,chain.rinkeby],
  [
    alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_ID as string }),
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({
  appName: "PGP signer",
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);
root.render(
  <React.Suspense fallback={<>loading...</>}>
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider
        theme={lightTheme({
          accentColor: "#000000",
          accentColorForeground: "white",
        })}
        chains={chains}
        modalSize="compact"
        initialChain={chain.localhost}
      >
        <App />
      </RainbowKitProvider>
    </WagmiConfig>
  </React.Suspense>
);


reportWebVitals();

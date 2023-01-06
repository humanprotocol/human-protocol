// eslint-disable-next-line no-use-before-define
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { chain, configureChains, createClient, WagmiConfig } from 'wagmi';
import { infuraProvider } from 'wagmi/providers/infura';
import { publicProvider } from 'wagmi/providers/public';
import * as React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';
import { store } from 'services/redux/store';
import { Spinner } from 'components/Spinner';
import { BrowserRouter } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { Web3ReactProvider } from '@web3-react/core';
import { networkMap } from 'constants/index';
import { getClient, getLibrary } from './utils';
import { AppNetworkContext } from './AppNetworkContext';
import AppComponent from './AppComponent';

const persistor = persistStore(store);

const { chains, provider } = configureChains(
  [chain.mainnet, chain.goerli, chain.polygon, chain.polygonMumbai],
  [
    infuraProvider({ apiKey: '9aa3d95b3bc440fa88ea12eaa4456161' }),
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'Human Job Launcher',
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

export const App = () => {
  const [network, setNetwork] = React.useState<string>('polygon');

  return (
    <React.StrictMode>
      <ReduxProvider store={store}>
        <PersistGate loading={<Spinner />} persistor={persistor}>
          <Web3ReactProvider getLibrary={getLibrary}>
            <BrowserRouter>
              <AppNetworkContext.Provider value={{ network, setNetwork }}>
                <ApolloProvider
                  client={getClient(networkMap[network].graphqlClientUrl)}
                >
                  <WagmiConfig client={wagmiClient}>
                    <RainbowKitProvider chains={chains}>
                      <AppComponent />
                    </RainbowKitProvider>
                  </WagmiConfig>
                </ApolloProvider>
              </AppNetworkContext.Provider>
            </BrowserRouter>
          </Web3ReactProvider>
        </PersistGate>
      </ReduxProvider>
    </React.StrictMode>
  );
};

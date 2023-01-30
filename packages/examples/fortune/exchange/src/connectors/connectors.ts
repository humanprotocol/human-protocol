import { goerli, mainnet, polygon, polygonMumbai } from '@wagmi/core/chains';
import { configureChains, createClient } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { publicProvider } from 'wagmi/providers/public';
import { fortune } from './chains';

const { chains, provider } = configureChains(
  [mainnet, polygon, goerli, polygonMumbai, fortune],
  [publicProvider()]
);

export const wagmiClient = createClient({
  connectors: [
    new InjectedConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        qrcode: true,
        version: '2',
        projectId: '68415bedd1597a33e8e83cc53e52071b',
      },
    }),
  ],
  provider,
});

import {
  goerli,
  mainnet,
  polygon,
  polygonMumbai,
  bsc,
  bscTestnet,
} from 'wagmi/chains';
import {
  EthereumClient,
  modalConnectors,
  walletConnectProvider,
} from '@web3modal/ethereum';
import { configureChains, createClient } from 'wagmi';
import { fortune } from './chains';

// 1. Get projectID at https://cloud.walletconnect.com
if (!process.env.REACT_APP_WALLETCONNECT_PROJECT_ID) {
  const message =
    'You need to provide REACT_APP_WALLETCONNECT_PROJECT_ID env variable';
  alert(message);
  throw new Error(message);
}
export const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID;

// 2. Configure wagmi client
const chains = [
  mainnet,
  polygon,
  bsc,
  goerli,
  polygonMumbai,
  bscTestnet,
  fortune,
];
const { provider } = configureChains(chains, [
  walletConnectProvider({ projectId }),
]);

export const wagmiClient = createClient({
  autoConnect: true,
  connectors: modalConnectors({
    appName: 'web3Modal',
    chains,
  }),
  provider,
});

// 3. Configure modal ethereum client
export const ethereumClient = new EthereumClient(wagmiClient, chains);

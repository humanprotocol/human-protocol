import {
  goerli,
  mainnet,
  polygon,
  polygonMumbai,
  bsc,
  bscTestnet,
  skaleHumanProtocol
} from 'wagmi/chains';
import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
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
  skaleHumanProtocol,
  goerli,
  polygonMumbai,
  bscTestnet,
  fortune,
];
const { provider } = configureChains(chains, [
  w3mProvider({ projectId }),
]);

export const wagmiClient = createClient({
  autoConnect: true,
  connectors: w3mConnectors({
    projectId,
    version: 2,
    chains,
  }),
  provider,
});

// 3. Configure modal ethereum client
export const ethereumClient = new EthereumClient(wagmiClient, chains);

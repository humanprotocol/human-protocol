import type { Chain } from 'viem/chains';
import * as chains from 'viem/chains';
import { env } from '@helpers/env';

//TODO: temporal fix. Should be fetched from API. https://github.com/humanprotocol/human-protocol/issues/2855
const ENABLED_CHAIN_IDS = env.VITE_ENABLED_CHAIN_IDS;
const chainIdsList = ENABLED_CHAIN_IDS.split(',').map((id) => parseInt(id, 10));

const LOCALHOST = {
  id: 1338,
  name: 'Localhost',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
};

const viemChains = Object.values(chains).map((chain) =>
  chain.id === 1338 ? LOCALHOST : chain
);

export const getNetwork = (chainId: number): Chain | undefined =>
  viemChains.find((network) => {
    if ('id' in network && network.id === chainId) {
      return network;
    }
  });

export const networks = chainIdsList
  .map((id) => getNetwork(id))
  .filter((chain): chain is Chain => !!chain);

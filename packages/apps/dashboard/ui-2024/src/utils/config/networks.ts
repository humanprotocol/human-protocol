import type { Chain } from 'viem/chains';
import * as chains from 'viem/chains';
import { env } from '@helpers/env';

//TODO: temporal fix. Should be fetched from API. https://github.com/humanprotocol/human-protocol/issues/2855
const ENABLED_CHAIN_IDS = env.VITE_ENABLED_CHAIN_IDS || '';
const chainIds = [1, 56, 137, 97, 80002, 11155111];
const chainIdsList = ENABLED_CHAIN_IDS.split(',')
  .map((id) => parseInt(id, 10))
  .filter((id) => chainIds.includes(id));

const viemChains = Object.values(chains);

export const getNetwork = (chainId: number): Chain | undefined =>
  viemChains.find((network) => {
    if ('id' in network && network.id === chainId) {
      return network;
    }
  });

export const networks = chainIdsList
  .map((id) => getNetwork(id))
  .filter((chain): chain is Chain => !!chain);

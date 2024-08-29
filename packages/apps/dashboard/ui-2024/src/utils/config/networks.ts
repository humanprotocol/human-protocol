import type { Chain } from 'viem/chains';
import * as chains from 'viem/chains';

const chainIdsList = [1, 56, 97, 137, 1284, 43114, 42220, 196];

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

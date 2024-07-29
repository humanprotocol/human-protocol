import type { Chain } from 'viem/chains';
import * as chains from 'viem/chains';

const chainIdsList = [
	1, 4, 5, 11155111, 56, 97, 137, 80001, 80002, 1284, 1287, 43113, 43114, 42220,
	44787, 195, 1338, 196,
];

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

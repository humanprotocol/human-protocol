import { ChainId, NETWORKS, StatisticsClient } from '@human-protocol/sdk';

const VALID_NETWORKS = Object.entries(NETWORKS).filter(([chainId]) => {
	return Number(chainId) !== ChainId.SKALE; // this chain causes timeout
});

// this class defines all client available in app
export class StatisticsClients {
	private static instance: StatisticsClients;
	private clients: Partial<Record<ChainId, StatisticsClient>>;

	private constructor() {
		this.clients = {};
		VALID_NETWORKS.forEach(([chainId, networkData]) => {
			const _chainId = Number(chainId) as ChainId;
			this.clients[_chainId] = new StatisticsClient(networkData);
		});
	}

	public static getInstance(): StatisticsClients {
		if (!StatisticsClients.instance) {
			StatisticsClients.instance = new StatisticsClients();
		}
		return StatisticsClients.instance;
	}

	public getClientForChainId(chainId: ChainId) {
		return this.clients[chainId];
	}

	public getClients() {
		return Object.values(this.clients);
	}
}

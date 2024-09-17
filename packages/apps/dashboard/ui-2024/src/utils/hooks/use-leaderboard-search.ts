import { networks } from '@utils/config/networks';
import { create } from 'zustand';
import type { Chain } from 'viem/chains';

export const leaderboardSearchSelectConfig: (
	| Chain
	| { name: 'All Networks'; allNetworksId: -1 }
)[] = [{ name: 'All Networks', allNetworksId: -1 }, ...networks];

export interface LeaderboardSearchStore {
	filterParams: {
		chainId: number;
	};
	setChainId: (chainId: number) => void;
}

export const useLeaderboardSearch = create<LeaderboardSearchStore>((set) => ({
	filterParams: {
		chainId: -1,
	},
	setChainId: (chainId) => {
		set((state) => ({
			filterParams: {
				...state.filterParams,
				chainId,
			},
		}));
	},
}));

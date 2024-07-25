import { create } from 'zustand';

export interface WalletSearchStore {
	filterParams: {
		address: string;
		chainId: number;
	};
	setAddress: (address: string) => void;
	setChainId: (chainId: number) => void;
}

export const useWalletSearch = create<WalletSearchStore>((set) => ({
	filterParams: {
		address: '',
		chainId: 1,
	},
	setAddress: (address) => {
		set((state) => ({
			filterParams: {
				...state.filterParams,
				address,
			},
		}));
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

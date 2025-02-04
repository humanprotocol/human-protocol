import { create } from 'zustand';

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

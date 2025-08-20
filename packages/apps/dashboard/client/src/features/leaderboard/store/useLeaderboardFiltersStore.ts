import { create } from 'zustand';

type LeaderboardFiltersStore = {
  chainId: number;
  setChainId: (chainId: number) => void;
};

const useLeaderboardFiltersStore = create<LeaderboardFiltersStore>((set) => ({
  chainId: -1,
  setChainId: (chainId) => {
    set({ chainId });
  },
}));

export default useLeaderboardFiltersStore;

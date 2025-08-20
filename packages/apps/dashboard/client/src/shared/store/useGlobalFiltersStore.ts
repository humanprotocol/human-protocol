import { create } from 'zustand';

type GlobalFiltersStore = {
  address: string;
  chainId: number;
  setAddress: (address: string) => void;
  setChainId: (chainId: number) => void;
};

const useGlobalFiltersStore = create<GlobalFiltersStore>((set) => ({
  address: '',
  chainId: -1,
  setAddress: (address) => {
    set({ address });
  },
  setChainId: (chainId) => {
    set({ chainId });
  },
}));

export default useGlobalFiltersStore;

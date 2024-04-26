import { create } from 'zustand';

interface JobsFilterStoreProps {
  isMobileFilterDrawerOpen: boolean;
  setMobileFilterDrawer: (isOpen: boolean) => void;
  filterParams: {
    sort?: 'ASC' | 'DESC';
    sort_field?: 'chain_id' | 'job_type' | 'reward_amount' | 'created_at';
    network?: 'MATIC' | 'POLYGON';
    job_type?: 'FORTUNE';
    status?:
      | 'ACTIVE'
      | 'COMPLETED'
      | 'CANCELED'
      | 'VALIDATION'
      | 'EXPIRED'
      | 'REJECTED';
    escrow_address?: string;
    page?: number;
    page_size?: number;
    [key: string]: string | number | undefined;
  };

  setFilterParams: (
    partialParams: Partial<JobsFilterStoreProps['filterParams']>
  ) => void;
  searchEscrowAddress?: string;
  setSearchEscrowAddress: (address: string) => void;
}

export const useJobsFilterStore = create<JobsFilterStoreProps>((set) => ({
  isMobileFilterDrawerOpen: false,
  setMobileFilterDrawer: (isOpen) => {
    set((state) => ({ ...state, isMobileFilterDrawerOpen: isOpen }));
  },
  filterParams: {},
  setFilterParams: (
    partialParams: Partial<JobsFilterStoreProps['filterParams']>
  ) => {
    set((state) => ({
      ...state,
      filterParams: {
        ...state.filterParams,
        ...partialParams,
      },
    }));
  },
  searchEscrowAddress: undefined,
  setSearchEscrowAddress: (address: string) => {
    set((state) => ({
      ...state,
      searchEscrowAddress: address,
    }));
  },
}));

/* eslint-disable camelcase -- api params*/
import { create } from 'zustand';

interface SearchUpdaterProps {
  id: string;
  value: string;
}

interface JobsFilterStoreProps {
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
  } | null;
  setFilterParams: (
    partialParams: Partial<JobsFilterStoreProps['filterParams']>
  ) => void;
  resetFilterParams: () => void;
  setSearchEscrowAddress: (searchParams: SearchUpdaterProps[]) => void;
}

const initialFiltersState = null;

export const useJobsFilterStore = create<JobsFilterStoreProps>((set) => ({
  filterParams: initialFiltersState,
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
  resetFilterParams: () => {
    set({ filterParams: initialFiltersState });
  },
  setSearchEscrowAddress: (searchParams: SearchUpdaterProps[]) => {
    const escrowAddress = searchParams[0]?.value;
    if (escrowAddress) {
      set((state) => ({
        ...state,
        filterParams: {
          ...state.filterParams,
          escrow_address: escrowAddress,
        },
      }));
    }
  },
}));

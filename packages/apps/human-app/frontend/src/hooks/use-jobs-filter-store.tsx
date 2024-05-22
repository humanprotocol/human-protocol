/* eslint-disable camelcase -- api params*/
import { create } from 'zustand';

interface SearchUpdaterProps {
  id: string;
  value: string;
}

export interface JobsFilterStoreProps {
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
    page: number;
    page_size: number;
    fields: string[];
    oracle_address?: string;
  };
  setFilterParams: (
    partialParams: Partial<JobsFilterStoreProps['filterParams']>
  ) => void;
  resetFilterParams: () => void;
  setSearchEscrowAddress: (searchParams: SearchUpdaterProps[]) => void;
  setOracleAddress: (oracleAddress: string) => void;
}

const initialFiltersState = {
  page: 0,
  page_size: 5,
  fields: ['reward_amount', 'job_description', 'reward_token'],
};

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
  setOracleAddress: (oracleAddress: string) => {
    set((state) => ({
      ...state,
      filterParams: {
        ...state.filterParams,
        oracle_address: oracleAddress,
      },
    }));
  },
}));

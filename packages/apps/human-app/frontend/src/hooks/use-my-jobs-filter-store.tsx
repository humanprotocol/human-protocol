/* eslint-disable camelcase -- api params*/
import { create } from 'zustand';

interface SearchUpdaterProps {
  id: string;
  value: string;
}

export const jobStatuses = [
  'ACTIVE',
  'COMPLETED',
  'CANCELED',
  'VALIDATION',
  'EXPIRED',
  'REJECTED',
] as const;

type JobStatus = (typeof jobStatuses)[number];

export interface MyJobsFilterStoreProps {
  filterParams: {
    sort?: 'ASC' | 'DESC';
    sort_field?: 'chain_id' | 'job_type' | 'reward_amount' | 'expires_at';
    job_type?: string;
    status?: JobStatus;
    escrow_address?: string;
    page: number;
    page_size: number;
    chain_id?: number;
    address?: string;
  };
  availableJobTypes: string[];
  setFilterParams: (
    partialParams: Partial<MyJobsFilterStoreProps['filterParams']>
  ) => void;
  resetFilterParams: () => void;
  setSearchEscrowAddress: (searchParams: SearchUpdaterProps[]) => void;
  setOracleAddress: (oracleAddress: string) => void;
  setAvailableJobTypes: (jobTypes: string[]) => void;
}

const initialFiltersState = {
  page: 0,
  page_size: 5,
};

export const useMyJobsFilterStore = create<MyJobsFilterStoreProps>((set) => ({
  filterParams: initialFiltersState,
  availableJobTypes: [],
  setFilterParams: (
    partialParams: Partial<MyJobsFilterStoreProps['filterParams']>
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
        address: oracleAddress,
      },
    }));
  },
  setAvailableJobTypes: (jobTypes: string[]) => {
    set((state) => ({
      ...state,
      jobTypes,
    }));
  },
}));

/* eslint-disable camelcase -- api params*/
import { create } from 'zustand';
import type { PageSize } from '@/shared/types/entity.type';

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
    page_size: PageSize;
    chain_id?: number;
  };
  availableJobTypes: string[];
  setFilterParams: (
    partialParams: Partial<MyJobsFilterStoreProps['filterParams']>
  ) => void;
  resetFilterParams: () => void;
  setSearchEscrowAddress: (escrow_address: string) => void;
  setOracleAddress: (oracleAddress: string) => void;
  setAvailableJobTypes: (jobTypes: string[]) => void;
  setPageParams: (pageIndex: number, pageSize: PageSize) => void;
}

const initialFiltersState = {
  page: 0,
  page_size: 5,
} as const;

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
        page: 0,
      },
    }));
  },
  setPageParams: (pageIndex: number, pageSize: PageSize) => {
    set((state) => ({
      ...state,
      filterParams: {
        ...state.filterParams,
        page: pageIndex,
        page_size: pageSize,
      },
    }));
  },
  resetFilterParams: () => {
    set({ filterParams: initialFiltersState });
  },
  setSearchEscrowAddress: (escrow_address: string) => {
    set((state) => ({
      ...state,
      filterParams: {
        ...state.filterParams,
        escrow_address,
      },
    }));
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

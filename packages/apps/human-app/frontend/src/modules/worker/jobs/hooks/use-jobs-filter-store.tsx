/* eslint-disable camelcase -- api params*/
import { create } from 'zustand';
import type { PageSize } from '@/shared/types/entity.type';
import { MyJobStatus, type SortDirection, type SortField } from '../types';

export interface JobsFilterStoreProps {
  filterParams: {
    sort?: SortDirection;
    sort_field?: SortField;
    network?: 'MATIC' | 'POLYGON';
    // TODO add allowed job types
    job_type?: string;
    status?: MyJobStatus;
    escrow_address?: string;
    page: number;
    page_size: PageSize;
    fields: string[];
    chain_id?: number;
  };
  setFilterParams: (
    partialParams: Partial<JobsFilterStoreProps['filterParams']>
  ) => void;
  resetFilterParams: () => void;
  setSearchEscrowAddress: (escrow_address: string) => void;
  setOracleAddress: (oracleAddress: string) => void;
  setPageParams: (pageIndex: number, pageSize: PageSize) => void;
}

const initialFiltersState = {
  page: 0,
  page_size: 5,
  fields: ['reward_amount', 'job_description', 'reward_token'],
  status: MyJobStatus.ACTIVE,
  escrow_address: '',
} satisfies Pick<
  JobsFilterStoreProps['filterParams'],
  'page_size' | 'page' | 'fields' | 'status' | 'escrow_address'
>;

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
        oracle_address: oracleAddress,
      },
    }));
  },
}));

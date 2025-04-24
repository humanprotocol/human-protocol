/* eslint-disable camelcase -- api params*/
import { create } from 'zustand';
import type { PageSize } from '@/shared/types/entity.type';
import { SortDirection, SortField, type MyJobStatus } from '../types';

export interface MyJobsFilterStoreProps {
  filterParams: {
    sort?: SortDirection;
    sort_field?: SortField;
    job_type?: string;
    status?: MyJobStatus;
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
  escrow_address: '',
  page: 0,
  page_size: 5,
  sort_field: SortField.CREATED_AT,
  sort: SortDirection.DESC,
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
    set((state) => {
      if (state.filterParams.escrow_address === escrow_address) return state;

      return {
        ...state,
        filterParams: {
          ...state.filterParams,
          escrow_address,
        },
      };
    });
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

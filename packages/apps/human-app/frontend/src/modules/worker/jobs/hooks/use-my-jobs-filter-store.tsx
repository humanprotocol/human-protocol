import { create } from 'zustand';
import type { PageSize } from '@/shared/types/entity.type';
import { SortDirection, SortField, type StatusFilterType } from '../types';

export interface MyJobsFilterStoreProps {
  filterParams: {
    status?: StatusFilterType;
    oracle_address?: string;
    page: number;
    page_size: PageSize;
  };
  setFilterParams: (
    partialParams: Partial<MyJobsFilterStoreProps['filterParams']>
  ) => void;
  resetFilterParams: () => void;
  setPageParams: (pageIndex: number, pageSize: PageSize) => void;
}

const initialFiltersState = {
  oracle_address: undefined,
  status: '',
  page: 0,
  page_size: 5,
  sort_field: SortField.CREATED_AT,
  sort_direction: SortDirection.DESC,
} as const;

export const useMyJobsFilterStore = create<MyJobsFilterStoreProps>((set) => ({
  filterParams: initialFiltersState,
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
    set((state) => {
      if (
        state.filterParams.page === pageIndex &&
        state.filterParams.page_size === pageSize
      ) {
        return state;
      }

      return {
        ...state,
        filterParams: {
          ...state.filterParams,
          page: pageIndex,
          page_size: pageSize,
        },
      };
    });
  },
  resetFilterParams: () => {
    set({ filterParams: initialFiltersState });
  },
}));

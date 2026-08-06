import { create } from 'zustand';
import type { PageSize } from '@/shared/types/entity.type';

export interface JobsFilterStoreProps {
  filterParams: {
    page: number;
    page_size: PageSize;
  };
  setFilterParams: (
    partialParams: Partial<JobsFilterStoreProps['filterParams']>
  ) => void;
  resetFilterParams: () => void;
  setPageParams: (pageIndex: number, pageSize: PageSize) => void;
}

const initialFiltersState = {
  page: 0,
  page_size: 5,
} satisfies JobsFilterStoreProps['filterParams'];

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
}));

import { create } from 'zustand';

interface MobileFilterStore {
  isMobileFilterDrawerOpen: boolean;
  openMobileFilterDrawer: () => void;
  closeMobileFilterDrawer: () => void;
  uniqueValues: {
    network: string[];
    jobType: string[];
  };
  availableJobsFilters: {
    sortingOrder: {
      sortingColumn: string;
      sortingOrder: string;
    };
    network: string[];
    jobType: string[];
  };
  setUniqueValues: (values: Partial<MobileFilterStore['uniqueValues']>) => void;
  setAvailableJobsFilters: (
    values: Partial<MobileFilterStore['availableJobsFilters']>
  ) => void;
}

export const useMobileDrawerFilterStore = create<MobileFilterStore>((set) => ({
  isMobileFilterDrawerOpen: false,
  openMobileFilterDrawer: () => {
    set((state) => ({ ...state, isMobileFilterDrawerOpen: true }));
  },
  closeMobileFilterDrawer: () => {
    set((state) => ({ ...state, isMobileFilterDrawerOpen: false }));
  },
  uniqueValues: {
    network: [],
    jobType: [],
  },
  availableJobsFilters: {
    sortingOrder: {
      sortingColumn: 'jobDescription',
      sortingOrder: 'ASC',
    },
    network: [],
    jobType: [],
  },
  setUniqueValues: (values) => {
    set((state) => ({
      ...state,
      uniqueValues: { ...state.uniqueValues, ...values },
    }));
  },
  setAvailableJobsFilters: (values) => {
    set((state) => ({
      ...state,
      availableJobsFilters: { ...state.availableJobsFilters, ...values },
    }));
  },
}));

import { create } from 'zustand';

interface MobileFilterStore {
  isMobileFilterDrawerOpen: boolean;
  openMobileFilterDrawer: () => void;
  closeMobileFilterDrawer: () => void;
  uniqueValues: {
    network: string[];
    jobType: string[];
  };
  myJobsUniqueValues: {
    network: string[];
    jobType: string[];
    status: 'Active' | 'Overdue' | 'Deactivated' | 'Complited';
  };
  activeJobsTab: 'availableJobs' | 'myJobs';
  availableJobsFilters: {
    sortingOrder: {
      sortingColumn: string;
      sortingOrder: string;
    };
    network: string[];
    jobType: string[];
  };
  myJobsFilters: {
    sortingOrder: {
      sortingColumn: string;
      sortingOrder: string;
    };
    network: string[];
    jobType: string[];
    status: string[];
  };
  setUniqueValues: (values: Partial<MobileFilterStore['uniqueValues']>) => void;
  setMyJobsUniqueValues: (
    values: Partial<MobileFilterStore['myJobsUniqueValues']>
  ) => void;
  setAvailableJobsFilters: (
    values: Partial<MobileFilterStore['availableJobsFilters']>
  ) => void;
  setMyJobsFilters: (
    values: Partial<MobileFilterStore['myJobsFilters']>
  ) => void;
  setActiveJobsTab: (activeTab: MobileFilterStore['activeJobsTab']) => void;
}

export const useMobileDrawerFilterStore = create<MobileFilterStore>((set) => ({
  isMobileFilterDrawerOpen: false,
  openMobileFilterDrawer: () => {
    set((state) => ({ ...state, isMobileFilterDrawerOpen: true }));
  },
  closeMobileFilterDrawer: () => {
    set((state) => ({ ...state, isMobileFilterDrawerOpen: false }));
  },
  activeJobsTab: 'availableJobs',
  uniqueValues: {
    network: [],
    jobType: [],
  },
  myJobsUniqueValues: {
    network: [],
    jobType: [],
    status: 'Active',
  },
  availableJobsFilters: {
    sortingOrder: {
      sortingColumn: 'jobDescription',
      sortingOrder: 'ASC',
    },
    network: [],
    jobType: [],
  },
  myJobsFilters: {
    sortingOrder: {
      sortingColumn: 'jobDescription',
      sortingOrder: 'ASC',
    },
    network: [],
    jobType: [],
    status: [],
  },
  setUniqueValues: (values) => {
    set((state) => ({
      ...state,
      uniqueValues: { ...state.uniqueValues, ...values },
    }));
  },
  setMyJobsUniqueValues: (values) => {
    set((state) => ({
      ...state,
      myJobsUniqueValues: {
        ...state.myJobsUniqueValues,
        ...values,
      },
    }));
  },
  setAvailableJobsFilters: (values) => {
    set((state) => ({
      ...state,
      availableJobsFilters: { ...state.availableJobsFilters, ...values },
    }));
  },
  setMyJobsFilters: (values) => {
    set((state) => ({
      ...state,
      myJobsFilters: { ...state.myJobsFilters, ...values },
    }));
  },
  setActiveJobsTab: (activeTab) => {
    set((state) => ({
      ...state,
      activeJobsTab: activeTab,
    }));
  },
}));

import { create } from 'zustand';

export interface JobsTypesOraclesFilterStore {
  selectedJobType: string[];
  selectJobType: (jobType: string[]) => void;
}

export const useJobsTypesOraclesFilter = create<JobsTypesOraclesFilterStore>(
  (set) => ({
    selectedJobType: [],
    selectJobType: (jobType: string[]) => {
      set((state) => ({
        ...state,
        selectedJobType: jobType,
      }));
    },
  })
);

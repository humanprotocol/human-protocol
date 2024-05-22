import { create } from 'zustand';

export interface JobsTypesOraclesFilterStore {
  selectedJobType?: string;
  selectJobType: (jobType: string | undefined) => void;
}

export const useJobsTypesOraclesFilter = create<JobsTypesOraclesFilterStore>(
  (set) => ({
    selectedJobType: undefined,
    selectJobType: (jobType: string | undefined) => {
      set((state) => ({
        ...state,
        selectedJobType: jobType,
      }));
    },
  })
);

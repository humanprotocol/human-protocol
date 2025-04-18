import { create } from 'zustand';

export interface JobsTypesOraclesFilterStore {
  selectedJobTypes: string[];
  selectJobType: (jobType: string[]) => void;
}

export const useJobsTypesOraclesFilterStore =
  create<JobsTypesOraclesFilterStore>((set) => ({
    selectedJobTypes: [],
    selectJobType: (jobTypes: string[]) => {
      set((state) => ({
        ...state,
        selectedJobTypes: jobTypes,
      }));
    },
  }));

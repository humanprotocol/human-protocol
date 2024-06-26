/* eslint-disable camelcase -- ... */
import { create } from 'zustand';

export interface JobsTypesOraclesFilterStore {
  selected_job_types: string[];
  selectJobType: (jobType: string[]) => void;
}

export const useJobsTypesOraclesFilter = create<JobsTypesOraclesFilterStore>(
  (set) => ({
    selected_job_types: [],
    selectJobType: (jobTypes: string[]) => {
      set((state) => ({
        ...state,
        selected_job_types: jobTypes.map((jobType) => jobType.toLowerCase()),
      }));
    },
  })
);

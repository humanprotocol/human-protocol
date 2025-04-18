/* eslint-disable camelcase */
import { useQuery } from '@tanstack/react-query';
import { useJobsTypesOraclesFilterStore } from '../jobs/hooks';
import { oraclesService } from '../services/oracles.service';

export function useGetOracles() {
  const { selectedJobTypes: selected_job_types } =
    useJobsTypesOraclesFilterStore();

  return useQuery({
    queryFn: async () => oraclesService.getOracles(selected_job_types),
    queryKey: ['oracles', selected_job_types],
  });
}

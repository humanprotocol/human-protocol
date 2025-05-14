import { useQuery } from '@tanstack/react-query';
import { useJobsTypesOraclesFilterStore } from '../jobs/hooks';
import * as oraclesService from '../services/oracles.service';

export function useGetOracles() {
  const { selectedJobTypes } = useJobsTypesOraclesFilterStore();

  return useQuery({
    queryFn: async () => oraclesService.getOracles(selectedJobTypes),
    queryKey: ['oracles', selectedJobTypes],
  });
}

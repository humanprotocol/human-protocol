import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { useJobsTypesOraclesFilter } from '@/hooks/use-job-types-oracles-table';

const OracleSuccessSchema = z.object({
  address: z.string(),
  role: z.string(),
  url: z.string(),
  jobTypes: z.array(z.string()),
});

const OraclesSuccessSchema = z.array(OracleSuccessSchema);

export type OracleSuccessResponse = z.infer<typeof OracleSuccessSchema>;
export type OraclesSuccessResponse = OracleSuccessResponse[];

export async function getOracles() {
  return apiClient(apiPaths.worker.oracles.path, {
    successSchema: OraclesSuccessSchema,
    options: { method: 'GET' },
  });
}

export function useGetOracles() {
  // TODO add selectedJobType do DTO
  const { selectedJobType } = useJobsTypesOraclesFilter();
  return useQuery({
    queryFn: getOracles,
    queryKey: ['oracles', selectedJobType],
  });
}

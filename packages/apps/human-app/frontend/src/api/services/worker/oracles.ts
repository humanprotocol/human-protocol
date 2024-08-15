/* eslint-disable camelcase -- ..*/
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { useJobsTypesOraclesFilter } from '@/hooks/use-job-types-oracles-table';
import { stringifyUrlQueryObject } from '@/shared/helpers/stringify-url-query-object';

const OracleSuccessSchema = z.object({
  address: z.string(),
  role: z.string(),
  url: z.string().optional().nullable(),
  jobTypes: z.array(z.string()),
});

const OraclesSuccessSchema = z.array(OracleSuccessSchema);

export type OracleSuccessResponse = z.infer<typeof OracleSuccessSchema>;
export type OraclesSuccessResponse = OracleSuccessResponse[];

export async function getOracles({
  selected_job_types,
}: {
  selected_job_types: string[];
}) {
  const queryParams = selected_job_types.length
    ? `?${stringifyUrlQueryObject({ selected_job_types })}`
    : '';

  return apiClient(`${apiPaths.worker.oracles.path}${queryParams}`, {
    successSchema: OraclesSuccessSchema,
    options: { method: 'GET' },
  });
}

export function useGetOracles() {
  const { selected_job_types } = useJobsTypesOraclesFilter();
  return useQuery({
    queryFn: () => getOracles({ selected_job_types }),
    queryKey: ['oracles', selected_job_types],
  });
}

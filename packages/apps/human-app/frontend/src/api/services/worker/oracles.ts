/* eslint-disable camelcase -- ..*/
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { useJobsTypesOraclesFilter } from '@/hooks/use-job-types-oracles-table';
import { stringifyUrlQueryObject } from '@/shared/helpers/stringify-url-query-object';
import { env } from '@/shared/env';

const OracleSuccessSchema = z.object({
  address: z.string(),
  role: z.string(),
  url: z.string().optional().nullable(),
  jobTypes: z.array(z.string()),
  registrationNeeded: z.boolean().optional().nullable(),
  registrationInstructions: z.string().optional().nullable(),
});

const OraclesSuccessSchema = z.array(OracleSuccessSchema);

export type OracleSuccessResponse = z.infer<typeof OracleSuccessSchema>;
export type OraclesSuccessResponse = OracleSuccessResponse[];

const H_CAPTCHA_ORACLE: OracleSuccessResponse = {
  address: env.VITE_H_CAPTCHA_ORACLE_ADDRESS,
  jobTypes: env.VITE_H_CAPTCHA_ORACLE_TASK_TYPES,
  role: env.VITE_H_CAPTCHA_ORACLE_ROLE,
  url: env.VITE_H_CAPTCHA_ORACLE_ANNOTATION_TOOL,
  registrationNeeded: false,
};

export async function getOracles({
  selected_job_types,
  signal,
}: {
  selected_job_types: string[];
  signal: AbortSignal;
}) {
  let oracles = [H_CAPTCHA_ORACLE];
  if (env.VITE_FEATURE_FLAG_JOBS_DISCOVERY) {
    const queryParams = selected_job_types.length
      ? `?${stringifyUrlQueryObject({ selected_job_types })}`
      : '';

    const result = await apiClient.fetcher(
      `${apiPaths.worker.oracles.path}${queryParams}`,
      {
        successSchema: OraclesSuccessSchema,
        options: { method: 'GET' },
      },
      signal
    );

    oracles = oracles.concat(result);
  }
  return oracles;
}

export function useGetOracles() {
  const { selected_job_types } = useJobsTypesOraclesFilter();
  return useQuery({
    queryFn: ({ signal }) => getOracles({ selected_job_types, signal }),
    queryKey: ['oracles', selected_job_types],
  });
}

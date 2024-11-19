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
  url: z.string(),
  jobTypes: z.array(z.string()),
  registrationNeeded: z.boolean().optional().nullable(),
  registrationInstructions: z.string().optional().nullable(),
});

const OraclesSuccessSchema = z.object({
  oracles: z.array(OracleSuccessSchema),
  chainIdsEnabled: z.array(z.string()),
});

export type OracleSuccessResponse = z.infer<typeof OracleSuccessSchema> & {
  name: string;
};
export type OraclesSuccessResponse = OracleSuccessResponse[];

const OracleNameToUrls = {
  CVAT: [
    'https://stg-exchange-oracle.humanprotocol.org',
    'https://exchange-oracle.humanprotocol.org',
  ],
  Fortune: ['https://stg-fortune-exchange-oracle-server.humanprotocol.org'],
} as const;

const oracleUrlToNameMap = new Map<string, string>();
for (const [oracleName, oracleUrls] of Object.entries(OracleNameToUrls)) {
  for (const oracleUrl of oracleUrls) {
    oracleUrlToNameMap.set(oracleUrl, oracleName);
  }
}

const H_CAPTCHA_ORACLE: OracleSuccessResponse = {
  address: env.VITE_H_CAPTCHA_ORACLE_ADDRESS,
  jobTypes: env.VITE_H_CAPTCHA_ORACLE_TASK_TYPES,
  role: env.VITE_H_CAPTCHA_ORACLE_ROLE,
  url: env.VITE_H_CAPTCHA_ORACLE_ANNOTATION_TOOL,
  name: 'hCaptcha',
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

    const fetchedOracles = await apiClient(
      `${apiPaths.worker.oracles.path}${queryParams}`,
      {
        successSchema: OraclesSuccessSchema,
        options: { method: 'GET' },
      },
      signal
    );

    oracles = oracles.concat(
      fetchedOracles.oracles.map((oracle) => ({
        ...oracle,
        name: oracleUrlToNameMap.get(oracle.url) ?? '',
      }))
    );
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

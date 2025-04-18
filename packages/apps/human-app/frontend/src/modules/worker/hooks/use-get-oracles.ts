/* eslint-disable camelcase -- ..*/
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { stringifyUrlQueryObject } from '@/shared/helpers/transfomers';
import { env } from '@/shared/env';
import { MainnetChains, TestnetChains } from '@/modules/smart-contracts/chains';
import { useJobsTypesOraclesFilterStore } from '../jobs/hooks';

const OracleSchema = z.object({
  address: z.string(),
  chainId: z.number(),
  role: z.string(),
  url: z.string(),
  jobTypes: z.array(z.string()),
  registrationNeeded: z.boolean().optional().nullable(),
  registrationInstructions: z.string().optional().nullable(),
});

const OraclesDiscoverySuccessSchema = z.array(OracleSchema);

export type Oracle = z.infer<typeof OracleSchema> & {
  name: string;
};

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

const isTestnet = env.VITE_NETWORK === 'testnet';

const H_CAPTCHA_ORACLE: Oracle = {
  address: env.VITE_H_CAPTCHA_ORACLE_ADDRESS,
  chainId: isTestnet ? TestnetChains[0].chainId : MainnetChains[0].chainId,
  jobTypes: env.VITE_H_CAPTCHA_ORACLE_TASK_TYPES,
  role: env.VITE_H_CAPTCHA_ORACLE_ROLE,
  url: env.VITE_H_CAPTCHA_ORACLE_ANNOTATION_TOOL,
  name: 'hCaptcha',
  registrationNeeded: false,
};

async function getOracles({
  selected_job_types,
  signal,
}: {
  selected_job_types: string[];
  signal: AbortSignal;
}) {
  let oracles: Oracle[] = [];
  if (
    selected_job_types.length === 0 ||
    selected_job_types.some((selected_job_type) =>
      H_CAPTCHA_ORACLE.jobTypes.includes(selected_job_type)
    )
  ) {
    oracles.push(H_CAPTCHA_ORACLE);
  }

  if (env.VITE_FEATURE_FLAG_JOBS_DISCOVERY) {
    const queryParams = selected_job_types.length
      ? `?${stringifyUrlQueryObject({ selected_job_types })}`
      : '';

    const results = await apiClient(
      `${apiPaths.worker.oracles.path}${queryParams}`,
      {
        successSchema: OraclesDiscoverySuccessSchema,
        options: { method: 'GET' },
      },
      signal
    );

    oracles = oracles.concat(
      results.map((oracle) => ({
        ...oracle,
        name: oracleUrlToNameMap.get(oracle.url) ?? '',
      }))
    );
  }

  return oracles;
}

export function useGetOracles() {
  const { selected_job_types } = useJobsTypesOraclesFilterStore();
  return useQuery({
    queryFn: ({ signal }) => getOracles({ selected_job_types, signal }),
    queryKey: ['oracles', selected_job_types],
  });
}

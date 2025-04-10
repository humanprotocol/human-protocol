/* eslint-disable camelcase */
import { useQuery } from '@tanstack/react-query';
import { env } from '@/shared/env';
import { MainnetChains, TestnetChains } from '@/modules/smart-contracts/chains';
import { useJobsTypesOraclesFilterStore } from '../jobs/hooks';
import {
  type Oracle,
  type OracleBase,
  oraclesService,
} from '../services/oracles.service';

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

export function useGetOracles() {
  const { selected_job_types } = useJobsTypesOraclesFilterStore();

  return useQuery({
    queryFn: async () => {
      try {
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
          const params = selected_job_types.length
            ? { selected_job_types }
            : undefined;

          const results = await oraclesService.getOracles(params);

          if (Array.isArray(results)) {
            oracles = oracles.concat(
              results.map((oracle: OracleBase) => ({
                ...oracle,
                name: oracleUrlToNameMap.get(oracle.url) ?? '',
              }))
            );
          }
        }

        return oracles;
      } catch (error) {
        throw new Error('Failed to get oracles');
      }
    },
    queryKey: ['oracles', selected_job_types],
  });
}

import { z } from 'zod';
import { ApiClientError, authorizedHumanAppApiClient } from '@/api';
import { env } from '@/shared/env';
import { MainnetChains, TestnetChains } from '@/modules/smart-contracts/chains';

const apiPaths = {
  oracles: '/oracles',
};

const OracleSchema = z.object({
  address: z.string(),
  chainId: z.number(),
  role: z.string(),
  url: z.string(),
  jobTypes: z.array(z.string()),
  registrationNeeded: z.boolean().optional().nullable(),
  registrationInstructions: z.string().optional().nullable(),
});

type OracleBase = z.infer<typeof OracleSchema>;

export type Oracle = OracleBase & {
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

async function getOracles(selectedJobTypes: string[]) {
  try {
    const params = selectedJobTypes.length
      ? // eslint-disable-next-line camelcase
        { selected_job_types: selectedJobTypes }
      : undefined;

    const queryParams = params ?? {};

    let oracles: Oracle[] = [];

    if (
      selectedJobTypes.length === 0 ||
      selectedJobTypes.some((t) => H_CAPTCHA_ORACLE.jobTypes.includes(t))
    ) {
      oracles.push(H_CAPTCHA_ORACLE);
    }

    if (env.VITE_FEATURE_FLAG_JOBS_DISCOVERY) {
      const results = await authorizedHumanAppApiClient.get<OracleBase[]>(
        apiPaths.oracles,
        {
          queryParams,
        }
      );

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
    if (error instanceof ApiClientError) {
      throw error;
    }

    throw new Error('Failed to get oracles');
  }
}

export { getOracles };

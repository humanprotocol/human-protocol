import { z } from 'zod';
import { ApiClientError, authorizedHumanAppApiClient } from '@/api';
import { env } from '@/shared/env';
import { TestnetChains } from '@/modules/smart-contracts/chains';

const apiPaths = {
  oracles: '/oracles',
};

const OracleSchema = z.object({
  address: z.string(),
  chainId: z.number(),
  role: z.string(),
  name: z.string(),
  url: z.string(),
  nTasks: z.number(),
  minRewardAmount: z.string(),
  maxRewardAmount: z.string(),
  rewardToken: z.string(),
  jobTypes: z.array(z.string()),
  registrationNeeded: z.boolean().optional().nullable(),
  registrationInstructions: z.string().optional().nullable(),
});

const OracleListSchema = z.array(OracleSchema);

type OracleBase = z.infer<typeof OracleSchema>;

export type Oracle = OracleBase & {
  name: string;
};

// const H_CAPTCHA_ORACLE: Oracle = {
//   address: env.VITE_H_CAPTCHA_ORACLE_ADDRESS,
//   chainId: isTestnet ? TestnetChains[0].chainId : MainnetChains[0].chainId,
//   jobTypes: env.VITE_H_CAPTCHA_ORACLE_TASK_TYPES,
//   role: env.VITE_H_CAPTCHA_ORACLE_ROLE,
//   url: env.VITE_H_CAPTCHA_ORACLE_ANNOTATION_TOOL,
//   name: 'hCaptcha',
//   registrationNeeded: false,
// };

//TODO: Remove before merging
const MOCKED_ORACLES: Oracle[] = [
  {
    address: '0x1111111111111111111111111111111111111111',
    chainId: TestnetChains[0].chainId,
    jobTypes: ['image_points'],
    role: 'Recording Oracle',
    url: 'https://example.com/oracle-1',
    name: 'Mock Oracle 1',
    nTasks: 1,
    minRewardAmount: '0.001',
    maxRewardAmount: '0.002',
    rewardToken: 'HMT',
    registrationNeeded: false,
  },
  {
    address: '0x2222222222222222222222222222222222222222',
    chainId: TestnetChains[0].chainId,
    jobTypes: ['image_points', 'image_boxes'],
    role: 'Recording Oracle',
    url: 'https://example.com/oracle-2',
    name: 'Mock Oracle 2',
    nTasks: 2,
    minRewardAmount: '0.1',
    maxRewardAmount: '0.2',
    rewardToken: 'HMT',
    registrationNeeded: false,
  },
  {
    address: '0x3333333333333333333333333333333333333333',
    chainId: TestnetChains[0].chainId,
    jobTypes: ['image_points', 'image_boxes'],
    role: 'Recording Oracle',
    url: 'https://example.com/oracle-3',
    name: 'Mock Oracle 3',
    nTasks: 3,
    minRewardAmount: '0.1',
    maxRewardAmount: '0.2',
    rewardToken: 'HMT',
    registrationNeeded: false,
  },
  {
    address: '0x4444444444444444444444444444444444444444',
    chainId: TestnetChains[0].chainId,
    jobTypes: [
      'image_points',
      'image_boxes',
      'image_polygons',
      'social_media_engagement',
    ],
    role: 'Recording Oracle',
    url: 'https://example.com/oracle-4',
    name: 'Mock Oracle 4',
    nTasks: 8,
    minRewardAmount: '1',
    maxRewardAmount: '2',
    rewardToken: 'HMT',
    registrationNeeded: false,
  },
];

async function getOracles(selectedJobTypes: string[]) {
  try {
    const params = selectedJobTypes.length
      ? { selected_job_types: selectedJobTypes }
      : undefined;

    const queryParams = params ?? {};

    let oracles: Oracle[] = [];

    if (selectedJobTypes.length === 0) {
      oracles.push(...MOCKED_ORACLES);
    }

    if (env.VITE_FEATURE_FLAG_JOBS_DISCOVERY) {
      const results = await authorizedHumanAppApiClient.get<OracleBase[]>(
        apiPaths.oracles,
        {
          queryParams,
        }
      );

      if (Array.isArray(results)) {
        const parsedResults = OracleListSchema.parse(results);
        oracles = oracles.concat(
          parsedResults.map((oracle: OracleBase) => ({
            ...oracle,
            name: oracle.name ? oracle.name.split(' ')[0] : '',
          }))
        );
      }
    }

    const oracleAddresses = new Set<string>();
    oracles = oracles.filter(({ address: oracleAddress }) => {
      if (oracleAddresses.has(oracleAddress)) {
        return false;
      }

      oracleAddresses.add(oracleAddress);
      return true;
    });

    return oracles;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    throw new Error('Failed to get oracles');
  }
}

export { getOracles };

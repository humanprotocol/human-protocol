import { z } from 'zod';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

const OraclesSuccessSchema = z.array(
  z.object({
    address: z.string(),
    role: z.string(),
    url: z.string(),
    jobTypes: z.array(z.string()),
  })
);

export async function getOracles() {
  return apiClient(apiPaths.worker.oracles.path, {
    successSchema: OraclesSuccessSchema,
    options: { method: 'GET' },
  });
}

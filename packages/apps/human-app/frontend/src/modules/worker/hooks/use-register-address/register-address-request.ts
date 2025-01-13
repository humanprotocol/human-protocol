import { z } from 'zod';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import type { RegisterAddressParams, RegisterAddressResponse } from './types';

const RegisterAddressSuccessSchema = z.object({
  success: z.boolean(),
});

export const registerAddressRequest = async (
  params: RegisterAddressParams
): Promise<RegisterAddressResponse> => {
  return apiClient(apiPaths.worker.registerAddress.path, {
    authenticated: true,
    withAuthRetry: apiPaths.worker.registerAddress.withAuthRetry,
    successSchema: RegisterAddressSuccessSchema,
    options: {
      method: 'POST',
      body: JSON.stringify(params),
    },
  });
};

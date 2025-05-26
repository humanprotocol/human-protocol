import { z } from 'zod';
import { ApiClientError, authorizedHumanAppApiClient } from '@/api';

const apiPaths = {
  idvStart: '/kyc/start',
  signedAddress: '/kyc/on-chain',
  registerAddress: '/user/register-address',
};

const idvStartSchema = z.object({
  url: z.string(),
});

type IdvStartSuccessSchema = z.infer<typeof idvStartSchema>;

async function startIdv() {
  try {
    const result =
      await authorizedHumanAppApiClient.post<IdvStartSuccessSchema>(
        apiPaths.idvStart,
        {
          successSchema: idvStartSchema,
        }
      );
    return result;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    throw new Error('Failed to start indentity verification process');
  }
}

async function registerAddress(data: {
  address: string;
  chainId: number;
  signature: string;
}) {
  try {
    await authorizedHumanAppApiClient.post(apiPaths.registerAddress, {
      body: data,
    });
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    throw new Error('Failed to register address.');
  }
}

export { startIdv, registerAddress };

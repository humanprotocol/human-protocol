import { z } from 'zod';
import { ApiClientError, authorizedHumanAppApiClient } from '@/api';

const apiPaths = {
  kycStart: '/kyc/start',
  signedAddress: '/kyc/on-chain',
  registerAddress: '/user/register-address',
};

const kycStartSchema = z.object({
  url: z.string(),
});

type KycStartSuccessSchema = z.infer<typeof kycStartSchema>;

class ProfileService {
  async startKyc() {
    try {
      const result =
        await authorizedHumanAppApiClient.post<KycStartSuccessSchema>(
          apiPaths.kycStart,
          {
            successSchema: kycStartSchema,
          }
        );
      return result;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      throw new Error('Failed to start KYC process');
    }
  }

  async registerAddress(data: {
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
}

export const profileService = new ProfileService();

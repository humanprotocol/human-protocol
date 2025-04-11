import { z } from 'zod';
import { ApiClientError, AuthorizedHttpApiClient, HttpApiClient } from '@/api';
import { env } from '@/shared/env';
import { AuthService } from '@/api/auth-service';

const apiPaths = {
  kycStart: '/kyc/start',
  signedAddress: '/kyc/on-chain',
  registerAddress: '/user/register-address',
};

export const kycStartSchema = z.object({
  url: z.string(),
});

export type KycStartSuccessSchema = z.infer<typeof kycStartSchema>;

export class ProfileService {
  private readonly authorizedHttpApiClient: AuthorizedHttpApiClient;

  constructor() {
    const httpClient = new HttpApiClient(env.VITE_API_URL);
    const authService = new AuthService(httpClient);
    this.authorizedHttpApiClient = new AuthorizedHttpApiClient(
      env.VITE_API_URL,
      authService
    );
  }

  async startKyc(data: { provider: string }) {
    try {
      const result =
        await this.authorizedHttpApiClient.post<KycStartSuccessSchema>(
          apiPaths.kycStart,
          {
            successSchema: kycStartSchema,
            body: data,
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
    signature?: string;
  }) {
    try {
      const result = await this.authorizedHttpApiClient.post<null>(
        apiPaths.registerAddress,
        {
          body: data,
        }
      );
      return result;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      throw new Error('Failed to register address.');
    }
  }
}

export const profileService = new ProfileService();

import { z } from 'zod';
import { ApiClientError, AuthorizedHttpApiClient, HttpApiClient } from '@/api';
import { env } from '@/shared/env';
import { AuthService } from '@/api/auth-service';

const apiPaths = {
  registrationInExchangeOracle: '/exchange-oracle-registration',
};

export const registeredOraclesSuccessResponseSchema = z.object({
  // eslint-disable-next-line camelcase
  oracle_addresses: z.array(z.string()),
});

export type RegisteredOraclesSuccessResponse = z.infer<
  typeof registeredOraclesSuccessResponseSchema
>;

export class JobsDiscoveryService {
  private readonly authorizedHttpApiClient: AuthorizedHttpApiClient;

  constructor() {
    const httpClient = new HttpApiClient(env.VITE_API_URL);
    const authService = new AuthService(httpClient);
    this.authorizedHttpApiClient = new AuthorizedHttpApiClient(
      env.VITE_API_URL,
      authService
    );
  }

  async getRegistrationDataOracles() {
    try {
      const result =
        await this.authorizedHttpApiClient.get<RegisteredOraclesSuccessResponse>(
          apiPaths.registrationInExchangeOracle,
          {
            successSchema: registeredOraclesSuccessResponseSchema,
          }
        );

      return result;
    } catch (error: unknown) {
      if (error instanceof ApiClientError) throw error;

      throw new Error('Failed to get oracle registration data.');
    }
  }
}

export const jobsDiscoveryService = new JobsDiscoveryService();

import { z } from 'zod';
import { ApiClientError, authorizedHumanAppApiClient } from '@/api';

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
  async getRegistrationDataOracles() {
    try {
      const result =
        await authorizedHumanAppApiClient.get<RegisteredOraclesSuccessResponse>(
          apiPaths.registrationInExchangeOracle,
          {
            successSchema: registeredOraclesSuccessResponseSchema,
          }
        );

      return result;
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      throw new Error('Failed to get oracle registration data.');
    }
  }
}

export const jobsDiscoveryService = new JobsDiscoveryService();

import { z } from 'zod';
import { ApiClientError, AuthorizedHttpApiClient, HttpApiClient } from '@/api';
import { env } from '@/shared/env';
import { AuthService } from '@/api/auth-service';

const apiPaths = {
  oracles: '/oracles',
};

export const OracleSchema = z.object({
  address: z.string(),
  chainId: z.number(),
  role: z.string(),
  url: z.string(),
  jobTypes: z.array(z.string()),
  registrationNeeded: z.boolean().optional().nullable(),
  registrationInstructions: z.string().optional().nullable(),
});

export const OraclesDiscoverySuccessSchema = z.array(OracleSchema);

export type OracleBase = z.infer<typeof OracleSchema>;

export type Oracle = OracleBase & {
  name: string;
};

export class OraclesService {
  private readonly authorizedHttpApiClient: AuthorizedHttpApiClient;

  constructor() {
    const httpClient = new HttpApiClient(env.VITE_API_URL);
    const authService = new AuthService(httpClient);
    this.authorizedHttpApiClient = new AuthorizedHttpApiClient(
      env.VITE_API_URL,
      authService
    );
  }

  async getOracles(params?: Record<string, unknown>) {
    try {
      const queryParams = params ?? {};

      const results = await this.authorizedHttpApiClient.get<OracleBase[]>(
        apiPaths.oracles,
        {
          queryParams,
        }
      );

      return results;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      throw new Error('Failed to get oracles');
    }
  }
}

export const oraclesService = new OraclesService();

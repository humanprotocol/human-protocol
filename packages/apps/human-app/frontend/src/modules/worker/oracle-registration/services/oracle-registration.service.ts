import { ApiClientError, AuthorizedHttpApiClient, HttpApiClient } from '@/api';
import { env } from '@/shared/env';
import { AuthService } from '@/api/auth-service';
import { type RegistrationInExchangeOracleDto } from '../schema';

const apiPaths = {
  registrationInExchangeOracle: '/exchange-oracle-registration',
};

export class OracleRegistrationService {
  private readonly authorizedHttpApiClient: AuthorizedHttpApiClient;

  constructor() {
    const httpClient = new HttpApiClient(env.VITE_API_URL);
    const authService = new AuthService(httpClient);
    this.authorizedHttpApiClient = new AuthorizedHttpApiClient(
      env.VITE_API_URL,
      authService
    );
  }

  async registerInExchangeOracle(data: RegistrationInExchangeOracleDto) {
    try {
      const result = await this.authorizedHttpApiClient.post(
        apiPaths.registrationInExchangeOracle,
        {
          body: { ...data },
        }
      );

      return result;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to register in exchange oracle');
    }
  }
}

export const oracleRegistrationService = new OracleRegistrationService();

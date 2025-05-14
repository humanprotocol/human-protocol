import { ApiClientError, authorizedHumanAppApiClient } from '@/api';
import { type RegistrationInExchangeOracleDto } from '../schema';

const apiPaths = {
  registrationInExchangeOracle: '/exchange-oracle-registration',
};

async function registerInExchangeOracle(data: RegistrationInExchangeOracleDto) {
  try {
    await authorizedHumanAppApiClient.post(
      apiPaths.registrationInExchangeOracle,
      {
        body: { ...data },
      }
    );
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new Error('Failed to register in exchange oracle');
  }
}

export { registerInExchangeOracle };

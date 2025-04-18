import { env } from '@/shared/env';
import {
  HttpApiClient,
  humanAppApiClient,
  type RequestConfig,
} from './http-api-client';
import { AuthService, type AuthProvider } from './auth-service';

export class AuthorizedHttpApiClient extends HttpApiClient {
  constructor(
    baseUrl: string,
    private readonly authProvider: AuthProvider
  ) {
    super(baseUrl);
  }

  protected async makeRequest<T = unknown>(
    method: string,
    path: string,
    config: RequestConfig
  ): Promise<T> {
    const token = await this.authProvider.getAccessToken();

    const _config = {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    };

    return super.makeRequest(method, path, _config);
  }
}

const authService = new AuthService(humanAppApiClient);

export const authorizedHumanAppApiClient = new AuthorizedHttpApiClient(
  env.VITE_API_URL,
  authService
);

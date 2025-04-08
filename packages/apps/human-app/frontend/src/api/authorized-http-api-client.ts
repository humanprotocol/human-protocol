import {
  ApiClientError,
  HttpApiClient,
  type RequestConfig,
} from './http-api-client';
import { type AuthProvider } from './auth-service';

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
    config: RequestConfig,
    retryOnFailedAuth = true
  ): Promise<T> {
    const token = await this.authProvider.getAccessToken();

    try {
      const _config = {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        },
      };

      return await super.makeRequest(method, path, _config);
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.status === 401 &&
        retryOnFailedAuth
      ) {
        await this.authProvider.refreshAccessToken();
        return await this.makeRequest(method, path, config, false);
      }

      if (error instanceof ApiClientError) {
        throw new ApiClientError(error.message, error.status, error.data);
      }

      throw error;
    }
  }
}

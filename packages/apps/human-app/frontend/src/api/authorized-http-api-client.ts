import { HttpApiClient, type RequestConfig } from './http-api-client';
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

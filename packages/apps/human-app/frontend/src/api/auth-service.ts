import { jwtDecode } from 'jwt-decode';
import { type SignInDto } from '@/modules/signin/worker/schemas';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import {
  type AuthTokensSuccessResponse,
  authTokensSuccessResponseSchema,
} from '@/shared/schemas';
import { type BrowserAuthProvider } from '@/shared/types/browser-auth-provider';
import { type HttpApiClient } from './http-api-client';

export interface AuthProvider {
  getAccessToken: () => Promise<string | null>;
  refreshAccessToken: () => Promise<void>;
}

const apiPaths = {
  signIn: '/auth/signin',
  refresh: '/auth/refresh',
};

export class AuthService implements AuthProvider {
  private readonly browserAuthProvider: BrowserAuthProvider =
    browserAuthProvider;

  private static refreshPromise: Promise<AuthTokensSuccessResponse | null> | null =
    null;

  constructor(private readonly httpClient: HttpApiClient) {}

  async signIn(data: SignInDto): Promise<AuthTokensSuccessResponse> {
    const res = await this.httpClient.post<AuthTokensSuccessResponse>(
      apiPaths.signIn,
      {
        successSchema: authTokensSuccessResponseSchema,
        body: data,
      }
    );

    return res;
  }

  async getAccessToken(): Promise<string | null> {
    const accessToken = this.browserAuthProvider.getAccessToken();

    if (!accessToken) {
      return null;
    }

    const decodedToken = jwtDecode<{ exp: number }>(accessToken);
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenExpiration = decodedToken.exp;

    if (tokenExpiration && tokenExpiration - currentTime < 30) {
      await this.refreshAccessToken();

      const newAccessToken = this.browserAuthProvider.getAccessToken();

      if (!newAccessToken) {
        return null;
      }

      return newAccessToken;
    }

    return accessToken;
  }

  async refreshAccessToken(): Promise<void> {
    const authType = this.browserAuthProvider.getAuthType();

    if (!authType) {
      throw new Error('Auth type not found');
    }

    if (!AuthService.refreshPromise) {
      AuthService.refreshPromise = this.fetchTokenRefresh();
    }

    const tokens = await AuthService.refreshPromise;

    AuthService.refreshPromise = null;

    if (tokens === null) {
      throw new Error('Failed to refresh access token');
    }

    browserAuthProvider.signIn(tokens, authType);
  }

  private async fetchTokenRefresh(): Promise<AuthTokensSuccessResponse | null> {
    const refreshToken = this.browserAuthProvider.getRefreshToken();

    if (!refreshToken) {
      return null;
    }

    try {
      const response = await this.httpClient.post<AuthTokensSuccessResponse>(
        apiPaths.refresh,
        {
          body: {
            refresh_token: refreshToken,
          },
        }
      );

      return response;
    } catch {
      return null;
    }
  }
}

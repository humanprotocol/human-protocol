import { ApiClientError, HttpApiClient } from '@/api';
import { env } from '@/shared/env';
import { type Web3SignInSuccessResponse } from '../hooks';

const apiPaths = {
  web3Auth: {
    signIn: '/auth/web3/signin',
  },
};

export class HomepageService {
  private readonly httpClient: HttpApiClient;

  constructor() {
    this.httpClient = new HttpApiClient(env.VITE_API_URL);
  }

  async web3SignIn(data: { signature?: string; address?: string }) {
    try {
      const result = await this.httpClient.post<Web3SignInSuccessResponse>(
        apiPaths.web3Auth.signIn,
        {
          body: data,
        }
      );
      return result;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      throw new Error('Failed to log in using web3.');
    }
  }
}

export const homepageService = new HomepageService();

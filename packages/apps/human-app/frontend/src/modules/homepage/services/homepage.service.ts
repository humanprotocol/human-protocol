import { HttpApiClient } from '@/api';
import { env } from '@/shared/env';
import { type Web3SignInSuccessResponse } from '../hooks';

const apiPaths = {
  web3Auth: {
    signIn: '/auth/web3/signin',
  },
};

interface Web3SignInData {
  signature?: string;
  address?: string;
}

export class HomepageService {
  private readonly httpClient: HttpApiClient;

  constructor() {
    this.httpClient = new HttpApiClient(env.VITE_API_URL);
  }

  async web3SignIn(data: Web3SignInData) {
    try {
      const result = await this.httpClient.post<Web3SignInSuccessResponse>(
        apiPaths.web3Auth.signIn,
        {
          body: { ...data },
        }
      );
      return result;
    } catch (error) {
      throw new Error('Failed to log in using web3.');
    }
  }
}

export const homepageService = new HomepageService();

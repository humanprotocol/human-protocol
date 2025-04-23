import { ApiClientError, humanAppApiClient } from '@/api';
import { type Web3SignInSuccessResponse } from '../hooks';

const apiPaths = {
  web3Auth: {
    signIn: '/auth/web3/signin',
  },
};

class HomepageService {
  async web3SignIn(data: { signature: string; address: string }) {
    try {
      const result = await humanAppApiClient.post<Web3SignInSuccessResponse>(
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

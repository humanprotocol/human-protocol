/* eslint-disable camelcase */
import { z } from 'zod';
import { ApiClientError, humanAppApiClient } from '@/api';
import { type SignUpDto } from '../worker/schema';

const apiPaths = {
  worker: {
    signUp: '/auth/signup',
  },
  operator: {
    web3Auth: {
      signUp: '/auth/web3/signup',
    },
  },
};

export const web3SignInSuccessResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});

export type Web3SignInSuccessResponse = z.infer<
  typeof web3SignInSuccessResponseSchema
>;

export class SignupService {
  async workerSignUp(data: Omit<SignUpDto, 'confirmPassword'>) {
    try {
      const result = await humanAppApiClient.post(apiPaths.worker.signUp, {
        body: data,
      });

      return result;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to sign up worker');
    }
  }

  async operatorWeb3SignUp(data: {
    message: string;
    signature: string;
    address: string;
  }) {
    try {
      const result = await humanAppApiClient.post<Web3SignInSuccessResponse>(
        apiPaths.operator.web3Auth.signUp,
        {
          body: data,
        }
      );
      return result;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to sign up operator with web3');
    }
  }
}

export const signupService = new SignupService();

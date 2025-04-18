import { ApiClientError, humanAppApiClient } from '@/api';

const apiPaths = {
  sendResetLink: '/password-reset/forgot-password',
  resetPassword: '/password-reset/restore-password',
};

export class PasswordService {
  async sendResetLink(data: { email: string }) {
    try {
      const result = await humanAppApiClient.post<null>(
        apiPaths.sendResetLink,
        {
          body: data,
        }
      );
      return result;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      throw new Error('Failed to send reset link');
    }
  }

  async resetPassword(data: { token: string; password: string }) {
    try {
      const result = await humanAppApiClient.post<null>(
        apiPaths.resetPassword,
        {
          body: data,
        }
      );
      return result;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      throw new Error('Failed to reset password');
    }
  }
}

export const passwordService = new PasswordService();

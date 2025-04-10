import { ApiClientError, HttpApiClient } from '@/api';
import { env } from '@/shared/env';

const apiPaths = {
  sendResetLink: '/password-reset/forgot-password',
  resetPassword: '/password-reset/restore-password',
};

export class PasswordService {
  private readonly httpClient: HttpApiClient;

  constructor() {
    this.httpClient = new HttpApiClient(env.VITE_API_URL);
  }

  async sendResetLink(data: { email: string }) {
    try {
      const result = await this.httpClient.post<null>(apiPaths.sendResetLink, {
        body: data,
      });
      return result;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw new Error(error.message);
      }

      throw new Error('Failed to send reset link');
    }
  }

  async resetPassword(data: { token: string; password: string }) {
    try {
      const result = await this.httpClient.post<null>(apiPaths.resetPassword, {
        body: data,
      });
      return result;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw new Error(error.message);
      }

      throw new Error('Failed to reset password');
    }
  }
}

export const passwordService = new PasswordService();

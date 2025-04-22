import { ApiClientError, humanAppApiClient } from '@/api';
import { type SendResetLinkDto } from '../send-reset-link/schemas';
import { type ResetPasswordDto } from './types';

const apiPaths = {
  sendResetLink: '/password-reset/forgot-password',
  resetPassword: '/password-reset/restore-password',
};

export class PasswordService {
  async sendResetLink(data: SendResetLinkDto) {
    try {
      const result = await humanAppApiClient.post(apiPaths.sendResetLink, {
        body: data,
      });
      return result;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      throw new Error('Failed to send reset link');
    }
  }

  async resetPassword(
    data: Omit<ResetPasswordDto, 'confirmPassword'> & { token: string }
  ) {
    try {
      const result = await humanAppApiClient.post(apiPaths.resetPassword, {
        body: data,
      });
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

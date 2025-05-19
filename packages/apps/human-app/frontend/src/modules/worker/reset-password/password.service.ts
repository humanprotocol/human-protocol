import { ApiClientError, humanAppApiClient } from '@/api';
import { type SendResetLinkDto } from '../send-reset-link/schemas';
import { type ResetPasswordDto } from './types';

const apiPaths = {
  sendResetLink: '/password-reset/forgot-password',
  resetPassword: '/password-reset/restore-password',
};

async function sendResetLink(data: SendResetLinkDto) {
  try {
    await humanAppApiClient.post(apiPaths.sendResetLink, {
      body: data,
    });
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    throw new Error('Failed to send reset link');
  }
}

async function resetPassword(
  data: Omit<ResetPasswordDto, 'confirmPassword'> & { token: string }
) {
  try {
    await humanAppApiClient.post(apiPaths.resetPassword, {
      body: data,
    });
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    throw new Error('Failed to reset password');
  }
}

export { sendResetLink, resetPassword };

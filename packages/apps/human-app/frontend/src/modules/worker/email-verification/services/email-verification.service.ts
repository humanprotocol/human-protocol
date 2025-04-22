import { ApiClientError, authorizedHumanAppApiClient } from '@/api';

const apiPaths = {
  verifyEmail: '/email-confirmation/email-verification',
  resendEmailVerification: '/email-confirmation/resend-email-verification',
};

export class EmailVerificationService {
  async verifyEmail(token: string) {
    try {
      const result = await authorizedHumanAppApiClient.get(
        `${apiPaths.verifyEmail}?token=${token}`
      );
      return result;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to verify email');
    }
  }

  async resendEmailVerification(token: string) {
    try {
      const result = await authorizedHumanAppApiClient.post(
        apiPaths.resendEmailVerification,
        {
          body: {
            // eslint-disable-next-line camelcase
            h_captcha_token: token,
          },
        }
      );
      return result;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to resend email verification');
    }
  }
}

export const emailVerificationService = new EmailVerificationService();

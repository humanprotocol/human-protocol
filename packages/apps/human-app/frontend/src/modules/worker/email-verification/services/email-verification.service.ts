import { ApiClientError, AuthorizedHttpApiClient, HttpApiClient } from '@/api';
import { env } from '@/shared/env';
import { AuthService } from '@/api/auth-service';

const apiPaths = {
  verifyEmail: '/email-confirmation/email-verification',
  resendEmailVerification: '/email-confirmation/resend-email-verification',
};

export class EmailVerificationService {
  private readonly authorizedHttpApiClient: AuthorizedHttpApiClient;

  constructor() {
    const httpClient = new HttpApiClient(env.VITE_API_URL);
    const authService = new AuthService(httpClient);
    this.authorizedHttpApiClient = new AuthorizedHttpApiClient(
      env.VITE_API_URL,
      authService
    );
  }

  async verifyEmail(token: string) {
    try {
      const result = await this.authorizedHttpApiClient.get(
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

  async resendEmailVerification(token: string, email: string) {
    try {
      const result = await this.authorizedHttpApiClient.post(
        apiPaths.resendEmailVerification,
        {
          body: {
            // eslint-disable-next-line camelcase
            h_captcha_token: token,
            email,
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

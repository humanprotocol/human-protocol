import { ApiClientError, authorizedHumanAppApiClient } from '@/api';

const apiPaths = {
  verifyEmail: '/email-confirmation/email-verification',
  resendEmailVerification: '/email-confirmation/resend-email-verification',
};

async function verifyEmail(token: string) {
  try {
    await authorizedHumanAppApiClient.post(apiPaths.verifyEmail, {
      body: {
        token,
      },
    });
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new Error('Failed to verify email');
  }
}

async function resendEmailVerification(token: string) {
  try {
    await authorizedHumanAppApiClient.post(apiPaths.resendEmailVerification, {
      body: {
        // eslint-disable-next-line camelcase
        h_captcha_token: token,
      },
    });
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new Error('Failed to resend email verification');
  }
}

export { verifyEmail, resendEmailVerification };

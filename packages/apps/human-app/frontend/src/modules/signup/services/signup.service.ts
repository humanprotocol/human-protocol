import { ApiClientError, humanAppApiClient } from '@/api';
import { type SignUpDto } from '../schema';

const signUpPath = '/auth/signup';

async function signUp(data: Omit<SignUpDto, 'confirmPassword'>) {
  try {
    const result = await humanAppApiClient.post(signUpPath, {
      body: {
        email: data.email,
        password: data.password,
        h_captcha_token: data.hCaptchaToken,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new Error('Failed to sign up worker');
  }
}

export { signUp };

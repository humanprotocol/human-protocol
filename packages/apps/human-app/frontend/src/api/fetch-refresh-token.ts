import { apiPaths } from '@/api/api-paths';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import { signInSuccessResponseSchema } from '@/modules/worker/services/sign-in/schema';

export const fetchTokenRefresh = async (baseUrl: string) => {
  const response = await fetch(
    `${baseUrl}${apiPaths.worker.obtainAccessToken.path}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // eslint-disable-next-line camelcase -- camel case defined by api
        refresh_token: browserAuthProvider.getRefreshToken(),
      }),
    }
  );

  if (!response.ok) {
    return null;
  }

  const data: unknown = await response.json();

  const refetchAccessTokenSuccess = signInSuccessResponseSchema.parse(data);

  return refetchAccessTokenSuccess;
};

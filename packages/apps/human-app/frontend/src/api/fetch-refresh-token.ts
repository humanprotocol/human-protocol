import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import { authTokensSuccessResponseSchema } from '@/shared/schemas';
import { commonApiPaths } from './common-api-paths';

export const fetchTokenRefresh = async (baseUrl: string) => {
  const response = await fetch(
    `${baseUrl}${commonApiPaths.auth.refresh.path}`,
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

  const refetchAccessTokenSuccess = authTokensSuccessResponseSchema.parse(data);

  return refetchAccessTokenSuccess;
};

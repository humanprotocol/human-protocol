import { z } from 'zod';

export const authTokensSuccessResponseSchema = z.object({
  // eslint-disable-next-line camelcase -- data from api
  access_token: z.string(),
  // eslint-disable-next-line camelcase -- data from api
  refresh_token: z.string(),
});

export type AuthTokensSuccessResponse = z.infer<
  typeof authTokensSuccessResponseSchema
>;

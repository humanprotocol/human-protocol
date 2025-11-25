import { z } from 'zod';

export const authTokensSuccessResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});

export type AuthTokensSuccessResponse = z.infer<
  typeof authTokensSuccessResponseSchema
>;

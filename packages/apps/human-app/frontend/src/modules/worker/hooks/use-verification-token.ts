import { z } from 'zod';
import { useLocationState } from '@/modules/worker/hooks/use-location-state';

export const tokenSchema = z.string().transform((value, ctx) => {
  const token = value.split('=')[1];
  if (!token) {
    ctx.addIssue({
      fatal: true,
      code: z.ZodIssueCode.custom,
      message: 'error',
    });
  }
  return token;
});

export function useVerificationToken() {
  const { field: token } = useLocationState({
    schema: tokenSchema,
    locationStorage: 'search',
  });

  return {
    token,
    isLoading: token === undefined,
  };
}

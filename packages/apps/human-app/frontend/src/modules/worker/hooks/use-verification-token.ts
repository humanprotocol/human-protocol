import { useLocationState } from '@/modules/worker/hooks/use-location-state';
import { tokenSchema } from '@/modules/worker/types/email-verification.types';

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

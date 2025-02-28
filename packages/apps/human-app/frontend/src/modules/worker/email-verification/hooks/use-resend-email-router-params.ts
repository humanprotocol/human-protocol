import { z } from 'zod';
import { useLocationState } from '@/modules/worker/hooks/use-location-state';

export const routerStateSchema = z.object({
  email: z.string().email(),
  resendOnMount: z.boolean().optional(),
});

export function useResendEmailRouterParams() {
  const { field: routerState } = useLocationState({
    keyInStorage: 'routerState',
    schema: routerStateSchema,
  });

  return routerState;
}

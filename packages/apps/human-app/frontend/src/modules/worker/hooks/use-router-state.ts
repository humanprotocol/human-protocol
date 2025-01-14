import { useLocationState } from '@/modules/worker/hooks/use-location-state';
import { routerStateSchema } from '@/modules/worker/types/email-verification.types';

export function useRouterState() {
  const { field: routerState } = useLocationState({
    keyInStorage: 'routerState',
    schema: routerStateSchema,
  });

  return routerState;
}

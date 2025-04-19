import { useQuery } from '@tanstack/react-query';
import { uiConfigService } from '../services/ui-config.service';

export function useGetUiConfig() {
  return useQuery({
    queryKey: ['ui-config'],
    queryFn: async () => uiConfigService.getUiConfig(),
    staleTime: Infinity,
  });
}

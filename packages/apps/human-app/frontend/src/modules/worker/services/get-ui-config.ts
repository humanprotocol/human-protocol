import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

const uiConfigSchema = z.object({
  chainIdsEnabled: z.array(z.number()),
});

export type UiConfig = z.infer<typeof uiConfigSchema>;

const getUiConfig = async (): Promise<UiConfig> => {
  const response = await apiClient(apiPaths.worker.uiConfig.path, {
    successSchema: uiConfigSchema,
    options: {
      method: 'GET',
    },
  });
  return response;
};

export function useGetUiConfig() {
  return useQuery({
    queryKey: ['ui-config'],
    queryFn: getUiConfig,
    staleTime: Infinity,
  });
}

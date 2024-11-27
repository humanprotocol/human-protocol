import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

const uiConfigSuccessSchema = z.object({
  chainIdsEnabled: z.array(z.number()),
});

export type UiConfigSuccess = z.infer<typeof uiConfigSuccessSchema>;

const getUiConfig = async () => {
  return apiClient(apiPaths.worker.uiConfig.path, {
    authenticated: true,
    successSchema: uiConfigSuccessSchema,
    options: {
      method: 'GET',
    },
  });
};

export function useGetUiConfig() {
  return useQuery({
    queryKey: ['ui-config'],
    queryFn: getUiConfig,
  });
}

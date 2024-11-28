import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

const uiConfigSuccessSchema = z.object({
  chainIdsEnabled: z.array(z.number()),
});

export type UiConfigSuccess = z.infer<typeof uiConfigSuccessSchema>;

const getUiConfig = async (): Promise<UiConfigSuccess> => {
  const cachedData = sessionStorage.getItem('ui-config');
  if (cachedData) {
    const parsedData = JSON.parse(cachedData) as number[];
    return uiConfigSuccessSchema.parse(parsedData);
  }

  const response = await apiClient(apiPaths.worker.uiConfig.path, {
    authenticated: true,
    successSchema: uiConfigSuccessSchema,
    options: {
      method: 'GET',
    },
  });

  sessionStorage.setItem('ui-config', JSON.stringify(response));
  return response;
};

export function useGetUiConfig() {
  return useQuery({
    queryKey: ['ui-config'],
    queryFn: getUiConfig,
  });
}

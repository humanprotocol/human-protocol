import { z } from 'zod';
import { ApiClientError, authorizedHumanAppApiClient } from '@/api';

const apiPaths = {
  uiConfig: '/ui-config',
};

const uiConfigSchema = z.object({
  chainIdsEnabled: z.array(z.number()),
});

type UiConfig = z.infer<typeof uiConfigSchema>;

class UiConfigService {
  async getUiConfig() {
    try {
      const result = await authorizedHumanAppApiClient.get<UiConfig>(
        apiPaths.uiConfig,
        {
          successSchema: uiConfigSchema,
        }
      );

      return result;
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to get UI config');
    }
  }
}

export const uiConfigService = new UiConfigService();

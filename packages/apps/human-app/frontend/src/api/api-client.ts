import { createFetcher } from '@/api/fetcher';
import { env } from '@/shared/env';

export const apiClient = createFetcher({
  baseUrl: env.VITE_API_URL,
  options: () => {
    const headers = new Headers({ 'Content-Type': 'application/json' });

    return {
      headers,
    };
  },
});

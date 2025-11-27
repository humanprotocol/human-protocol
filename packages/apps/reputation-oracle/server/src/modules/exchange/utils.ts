import { DEFAULT_TIMEOUT_MS } from '@/common/constants';
import Logger from '@/logger';

import { ExchangeApiClientError } from './errors';

export async function fetchWithHandling(
  url: string,
  headers: HeadersInit,
  logger: typeof Logger,
  timeoutMs?: number,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(timeoutMs || DEFAULT_TIMEOUT_MS),
    });
    return res;
  } catch (error) {
    const message: string = `Failed to make request for exchange`;
    logger.error(message, {
      url,
      error,
    });
    throw new ExchangeApiClientError(message);
  }
}

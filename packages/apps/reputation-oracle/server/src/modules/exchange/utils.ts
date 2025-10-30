import { DEFAULT_TIMEOUT_MS, type SupportedExchange } from '@/common/constants';
import Logger from '@/logger';

import { ExchangeApiClientError } from './errors';

export async function fetchWithHandling(
  id: SupportedExchange,
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
    const message: string = `Failed to fetch ${id.toUpperCase()}`;
    logger.error(message, {
      error,
    });
    throw new ExchangeApiClientError(message);
  }
}

import { BaseError } from '@/common/errors/base';

export class ExchangeApiClientError extends BaseError {}

export class ExchangeProviderResponseError extends BaseError {
  constructor(exchange: string, status: number, detail?: string) {
    const exchangeLabel = `${exchange.toUpperCase()} API`;
    const fallback = status ? `status ${status}` : 'an error';
    super(
      detail
        ? `${exchangeLabel} error: ${detail}`
        : `${exchangeLabel} responded with ${fallback}`,
    );
  }
}

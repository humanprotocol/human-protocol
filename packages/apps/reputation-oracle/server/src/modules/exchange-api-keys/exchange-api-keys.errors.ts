import { BaseError } from '@/common/errors/base';

export class ExchangeApiKeyNotFoundError extends BaseError {
  constructor(
    readonly userId: number,
    readonly exchangeName: string,
  ) {
    super('Exchange API key not found');
  }
}

export class IncompleteKeySuppliedError extends BaseError {
  constructor(readonly exchangeName: string) {
    super('Incomplete credentials supplied for exchange');
  }
}

export class KeyAuthorizationError extends BaseError {
  constructor(readonly exchangeName: string) {
    super("Provided API key can't be authorized on exchange");
  }
}

export class ActiveExchangeApiKeyExistsError extends BaseError {
  constructor(readonly userId: number) {
    super('User already has an active exchange API key');
  }
}

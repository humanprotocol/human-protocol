import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import {
  SUPPORTED_EXCHANGE_NAMES,
  type SupportedExchange,
} from '@/common/constants';

const validExchangeNameSet = new Set<SupportedExchange>(
  SUPPORTED_EXCHANGE_NAMES,
);
export function isValidExchangeName(input: string): input is SupportedExchange {
  return validExchangeNameSet.has(input as SupportedExchange);
}

@ValidatorConstraint({ name: 'ExchangeName', async: false })
export class ExchangeNameValidator implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    return isValidExchangeName(value);
  }

  defaultMessage({ property }: ValidationArguments): string {
    return `${property} must be one of the allowed values`;
  }
}

import { BaseError } from '../../common/errors/base';

export enum KycErrorMessage {
  NOT_FOUND = 'KYC session not found',
  ALREADY_APPROVED = 'KYC session already approved',
  VERIFICATION_IN_PROGRESS = 'KYC session verification in progress',
  DECLINED = 'KYC session declined',
  INVALID_KYC_PROVIDER_API_RESPONSE = 'Invalid KYC provider API response',
  COUNTRY_NOT_SET = 'Сountry is not set for the user',
  NO_WALLET_ADDRESS_REGISTERED = 'No wallet address registered on your account',
  KYC_NOT_APPROVED = 'KYC not approved',
}

export class KycError extends BaseError {
  userId: number;
  constructor(message: KycErrorMessage, userId: number) {
    super(message);
    this.userId = userId;
  }
}

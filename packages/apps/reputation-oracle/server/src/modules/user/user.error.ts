import { BaseError } from '../../common/errors/base';

export enum UserErrorMessage {
  NOT_FOUND = 'User not found.',
  ACCOUNT_CANNOT_BE_REGISTERED = 'Account cannot be registered.',
  BALANCE_COULD_NOT_BE_RETRIEVED = 'User balance could not be retrieved.',
  INVALID_CREDENTIALS = 'Invalid credentials.',
  ALREADY_ASSIGNED = 'User already has an address assigned.',
  NO_WALLET_ADDRESS_REGISTERED = 'No wallet address registered on your account.',
  KYC_NOT_APPROVED = 'KYC not approved.',
  LABELING_ENABLE_FAILED = 'Failed to enable labeling for this account.',
  INVALID_ROLE = 'User has an invalid role.',
  DUPLICATED_ADDRESS = 'The address you are trying to use already exists. Please check that the address is correct or use a different address.',
}

export class UserError extends BaseError {
  userId: number;
  constructor(message: UserErrorMessage, userId: number) {
    super(message);
    this.userId = userId;
  }
}

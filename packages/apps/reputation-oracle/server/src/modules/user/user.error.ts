import { BaseError } from '../../common/errors/base';

export enum UserErrorMessage {
  INVALID_ROLE = 'Invalid user role',
  MISSING_ADDRESS = 'Wallet address is missing',
  ADDRESS_EXISTS = 'Wallet address is already assigned',
  KYC_NOT_APPROVED = 'KYC not approved',
  LABELING_ENABLE_FAILED = 'Failed to enable hCaptcha labeling',
  OPERATOR_ALREADY_ACTIVE = 'Operator status is already active',
  OPERATOR_NOT_ACTIVE = 'Operator status is not active',
}

export class UserError extends BaseError {
  userId: number;
  constructor(message: UserErrorMessage, userId: number) {
    super(message);
    this.userId = userId;
  }
}

export class DuplicatedWalletAddressError extends BaseError {
  userId: number;
  constructor(userId: number, address: string) {
    super(`Wallet address already exists: ${address}`);
    this.userId = userId;
  }
}

export class InvalidWeb3SignatureError extends BaseError {
  userId: number;
  constructor(userId: number, address: string) {
    super(`Invalid web3 signature provided for: ${address}`);
    this.userId = userId;
  }
}

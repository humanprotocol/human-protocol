export enum CustomError {
  PRIVATE_KEY_IS_EMPTY = 'Private key is empty',
  SLACK_WEBHOOK_ERROR = 'Slack webhook URL is not provided',
  INVALID_INPUT = 'Invalid input',
  NETWORK_ERROR = 'Network error occurred',
  GAS_PRICE_ERROR = 'Error calculating gas price',
}

export enum WalletError {
  FAILED_REFILL_WALLET = 'Failed to refill wallet',
  WALLET_NOT_VERIFIED = 'Wallet is not verified',
  FAILED_TRANSFER_FUNDS = 'Failed to transfer funds',
  RECEIPT_NOT_RECEIVED = 'Receipt not received',
  BLOCK_NOT_FOUND = 'Block not found',
  FAILED_SAVE_TRANSACTION = 'Failed to save transaction',
  FAILED_GET_DAILY_LIMITS = 'Failed to get daily limits',
}

export enum Web3Error {
  GAS_PRICE_ERROR = 'Gas price error',
  INVALID_CHAIN_ID = 'Invalid chain id',
  NETWORK_NOT_FOUND = 'Network not found',
}

export enum StorageError {
  STORAGE_FILE_NOT_FOUND = 'Storage file not found',
  BUCKET_NOT_EXIST = 'Bucket not exist',
  FILE_NOT_UPLOADED = 'File not uploaded',
  FAILD_UPDATE_FILE = 'Failed to update file',
  FAILED_DELETE_OBJECT = 'Failed to delete object from storage',
}

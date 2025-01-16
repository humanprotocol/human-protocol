import { t } from 'i18next';
import { JsonRpcError } from '@/modules/smart-contracts/json-rpc-error';

export function jsonRpcErrorHandler(unknownError: unknown) {
  if (unknownError instanceof JsonRpcError) {
    return unknownError.message;
  }
  return t('errors.unknown');
}

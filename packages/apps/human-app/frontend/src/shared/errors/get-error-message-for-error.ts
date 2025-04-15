import { t } from 'i18next';
import { JsonRpcError } from '@/modules/smart-contracts/json-rpc-error';
import { ApiClientError } from '@/api';

type CustomErrorHandler = (unknownError: unknown) => string | undefined;

export function getErrorMessageForError(
  unknownError: Error | null,
  customErrorHandler?: CustomErrorHandler
): string {
  let customError: string | undefined;

  if (customErrorHandler) {
    customError = customErrorHandler(unknownError);
  }

  if (customError) {
    return customError;
  }

  if (unknownError instanceof JsonRpcError) {
    return t('errors.jsonRpcError');
  }

  if (unknownError instanceof ApiClientError) {
    if (unknownError.message) {
      return unknownError.message;
    }

    return t('errors.errorWithStatusCode', { code: unknownError.status });
  }

  if (unknownError instanceof Error) {
    return unknownError.message;
  }

  return t('errors.unknown');
}

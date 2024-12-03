import { t } from 'i18next';
import { FetchError } from '@/api/fetcher';
import { JsonRpcError } from '@/smart-contracts/json-rpc-error';

type CustomErrorHandler = (unknownError: unknown) => string | undefined;

export function defaultErrorMessage(
  unknownError: unknown,
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

  if (unknownError instanceof FetchError) {
    if (typeof unknownError.data === 'string') {
      return unknownError.data;
    }

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

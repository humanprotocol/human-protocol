import { t } from 'i18next';
import { FetchError } from '@/api/fetcher';

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

  if (unknownError instanceof FetchError) {
    return t('errors.errorWithStatusCode', { code: unknownError.status });
  }

  if (unknownError instanceof Error) {
    return t('errors.errorWithMessage', { message: unknownError.message });
  }
  return t('errors.unknown');
}

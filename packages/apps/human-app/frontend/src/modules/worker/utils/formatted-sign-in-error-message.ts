import { t } from 'i18next';
import { FetchError } from '@/api/fetcher';

export function formattedSignInErrorMessage(
  unknownError: unknown
): string | undefined {
  if (unknownError instanceof FetchError && unknownError.status === 400) {
    return t('worker.signInForm.errors.invalidCredentials');
  }
}

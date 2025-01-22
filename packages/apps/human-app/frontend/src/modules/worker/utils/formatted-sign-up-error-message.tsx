import { type TFunction } from 'i18next';
import { FetchError } from '@/api/fetcher';

export function formattedSignUpErrorMessage(
  unknownError: unknown,
  t: TFunction<['translation', ...never[]]>
): string | undefined {
  if (unknownError instanceof FetchError && unknownError.status === 409) {
    return t('worker.signUpForm.errors.emailTaken');
  }
}

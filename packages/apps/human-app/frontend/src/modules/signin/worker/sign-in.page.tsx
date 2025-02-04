import { t } from 'i18next';
import { PageCard } from '@/shared/components/ui/page-card';
import { Alert } from '@/shared/components/ui/alert';
import { getErrorMessageForError } from '@/shared/errors';
import { FetchError } from '@/api/fetcher';
import { useSignIn } from './use-sign-in';
import { SignInForm } from './sign-in-form';

function formattedSignInErrorMessage(
  unknownError: unknown
): string | undefined {
  if (unknownError instanceof FetchError && unknownError.status === 400) {
    return t('worker.signInForm.errors.invalidCredentials');
  }
}

export function SignInWorkerPage() {
  const { signIn, error, isError, isLoading, reset } = useSignIn();

  return (
    <PageCard
      title={t('worker.signInForm.title')}
      alert={
        isError ? (
          <Alert color="error" severity="error" sx={{ width: '100%' }}>
            {getErrorMessageForError(error, formattedSignInErrorMessage)}
          </Alert>
        ) : undefined
      }
    >
      <SignInForm
        onSubmit={signIn}
        error={error}
        isLoading={isLoading}
        resetMutation={reset}
      />
    </PageCard>
  );
}

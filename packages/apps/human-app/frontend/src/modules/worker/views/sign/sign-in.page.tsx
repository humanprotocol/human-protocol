import { t } from 'i18next';
import { PageCard } from '@/shared/components/ui/page-card';
import { Alert } from '@/shared/components/ui/alert';
import { FetchError } from '@/api/fetcher';
import { useSignIn } from '@/modules/worker/hooks/use-sign-in';
import { getErrorMessageForError } from '@/shared/errors';
import { SignInForm } from '@/modules/worker/components/sign-in/sign-in-form';

function formattedSignInErrorMessage(unknownError: unknown) {
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

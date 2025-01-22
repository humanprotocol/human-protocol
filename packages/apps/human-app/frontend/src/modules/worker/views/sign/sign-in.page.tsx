import { useTranslation } from 'react-i18next';
import { PageCard } from '@/shared/components/ui/page-card';
import { Alert } from '@/shared/components/ui/alert';
import { getErrorMessageForError } from '@/shared/errors';
import { SignInForm } from '@/modules/worker/components/sign-in/sign-in-form';
import { useSignIn } from '@/modules/worker/hooks/use-sign-in';
import { formattedSignInErrorMessage } from '@/modules/worker/utils/formatted-sign-in-error-message';

export function SignInWorkerPage() {
  const { t } = useTranslation();
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

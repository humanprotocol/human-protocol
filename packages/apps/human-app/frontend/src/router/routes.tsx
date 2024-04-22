import type { RouteProps } from 'react-router-dom';
import { HomePage } from '@/pages/homepage/home.page';
import { Playground } from '@/pages/playground/playground.page';
import { ProtectedPage } from '@/pages/protected.page';
import { SignInWorkerPage } from '@/pages/worker/sign-in.page';
import { SignUpWorkerPage } from '@/pages/worker/sign-up.page';
import { OperatorProfilePage } from '@/pages/operator/profile.page';
import { WorkerProfilePage } from '@/pages/worker/profile.page';
import { SignInOperatorPage } from '@/pages/operator/sign-in.page';
import { SignUpOperatorPage } from '@/pages/operator/sign-up.page';
import { routerPaths } from '@/router/router-paths';
import { SendResetLinkWorkerSuccessPage } from '@/pages/worker/send-reset-link/send-reset-link-success.page';
import { ResetPasswordWorkerPage } from '@/pages/worker/reset-password/reset-password.page';
import { SendResetLinkWorkerPage } from '@/pages/worker/send-reset-link/send-reset-link.page';
import { ResetPasswordWorkerSuccessPage } from '@/pages/worker/reset-password/reset-password-success.page';
import { EmailVerificationWorkerPage } from '@/pages/worker/email-verification/email-verification.page';
import { SendEmailVerificationWorkerPage } from '@/pages/worker/email-verification/send-email-verification.page';

export const unprotectedRoutes: RouteProps[] = [
  {
    path: routerPaths.homePage,
    element: <HomePage />,
  },
  {
    path: routerPaths.playground,
    element: <Playground />,
  },
  {
    path: routerPaths.worker.signIn,
    element: <SignInWorkerPage />,
  },
  {
    path: routerPaths.worker.signUp,
    element: <SignUpWorkerPage />,
  },
  {
    path: routerPaths.operator.signIn,
    element: <SignInOperatorPage />,
  },
  {
    path: routerPaths.operator.signUp,
    element: <SignUpOperatorPage />,
  },
];

export const protectedRoutes: RouteProps[] = [
  {
    path: '/protected',
    element: <ProtectedPage />,
  },
  {
    path: '/operator/profile',
    element: <OperatorProfilePage />,
  },
  {
    path: '/worker/profile',
    element: <WorkerProfilePage />,
  },
  {
    path: routerPaths.worker.emailVerification,
    element: <EmailVerificationWorkerPage />,
  },
  {
    path: routerPaths.worker.sendEmailVerification,
    element: <SendEmailVerificationWorkerPage />,
  },
  {
    path: routerPaths.worker.sendResetLink,
    element: <SendResetLinkWorkerPage />,
  },
  {
    path: routerPaths.worker.sendResetLinkSuccess,
    element: <SendResetLinkWorkerSuccessPage />,
  },
  {
    path: routerPaths.worker.resetPassword,
    element: <ResetPasswordWorkerPage />,
  },
  {
    path: routerPaths.worker.resetPasswordSuccess,
    element: <ResetPasswordWorkerSuccessPage />,
  },
];

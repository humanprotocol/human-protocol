import type { RouteProps } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import { env } from '@/shared/env';
import { RegistrationPage } from '@/modules/worker/oracle-registration';
import {
  HcaptchaLabelingPage,
  EnableLabelerPage,
} from '@/modules/worker/hcaptcha-labeling';
import {
  WorkerEmailVerificationProcessPage,
  WorkerVerifyEmailPage,
} from '@/modules/worker/email-verification';
import { SignInWorkerPage } from '@/modules/signin/worker';
import { JobsDiscoveryPage } from '@/modules/worker/jobs-discovery';
import { MyJobsPage } from '@/modules/worker/jobs/my-jobs/my-jobs.page';
import { WorkerProfilePage } from '@/modules/worker/profile';
import { SignUpWorkerPage } from '@/modules/signup/worker';
import { OperatorProfilePage } from '@/modules/operator/profile';
import { HomePage } from '@/modules/homepage';
import {
  AddKeysOperatorPage,
  AddStakeOperatorPage,
  EditExistingKeysSuccessPage,
  SetUpOperatorPage,
} from '@/modules/signup/operator';
import { JobsPage } from '@/modules/worker/jobs';
import {
  ResetPasswordWorkerPage,
  ResetPasswordWorkerSuccessPage,
} from '@/modules/worker/reset-password';
import {
  SendResetLinkWorkerPage,
  SendResetLinkWorkerSuccessPage,
} from '@/modules/worker/send-reset-link';

export const unprotectedRoutes: RouteProps[] = [
  {
    path: routerPaths.homePage,
    element: <HomePage />,
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
    path: routerPaths.worker.emailVerification,
    element: <WorkerEmailVerificationProcessPage />,
  },
  {
    path: routerPaths.worker.verifyEmail,
    element: <WorkerVerifyEmailPage />,
  },
  {
    path: routerPaths.worker.sendResetLink,
    element: <SendResetLinkWorkerPage />,
  },
  {
    path: routerPaths.worker.resetPassword,
    element: <ResetPasswordWorkerPage />,
  },
  {
    path: routerPaths.worker.sendResetLinkSuccess,
    element: <SendResetLinkWorkerSuccessPage />,
  },
  {
    path: routerPaths.worker.resetPasswordSuccess,
    element: <ResetPasswordWorkerSuccessPage />,
  },
];

export const protectedRoutes: {
  routerProps: RouteProps;
}[] = [
  {
    routerProps: {
      path: routerPaths.worker.jobsDiscovery,
      element: <JobsDiscoveryPage />,
    },
  },
  {
    routerProps: {
      path: routerPaths.worker.myJobs,
      element: <MyJobsPage />,
    },
  },
  ...(env.VITE_FEATURE_FLAG_JOBS_DISCOVERY
    ? [
        {
          routerProps: {
            path: `${routerPaths.worker.jobs}/:address`,
            element: <JobsPage />,
          },
        },
        {
          routerProps: {
            path: `${routerPaths.worker.registrationInExchangeOracle}/:address`,
            element: <RegistrationPage />,
          },
        },
      ]
    : []),
  {
    routerProps: {
      path: routerPaths.worker.profile,
      element: <WorkerProfilePage />,
    },
  },
  {
    routerProps: {
      path: routerPaths.worker.HcaptchaLabeling,
      element: <HcaptchaLabelingPage />,
    },
  },
  {
    routerProps: {
      path: routerPaths.worker.enableLabeler,
      element: <EnableLabelerPage />,
    },
  },
];

export const web3ProtectedRoutes: {
  routerProps: RouteProps;
}[] = [
  {
    routerProps: {
      path: routerPaths.operator.profile,
      element: <OperatorProfilePage />,
    },
  },
];

export const walletConnectRoutes: RouteProps[] = [
  {
    path: routerPaths.operator.addStake,
    element: <AddStakeOperatorPage />,
  },
  {
    path: routerPaths.operator.addKeys,
    element: <AddKeysOperatorPage />,
  },
  {
    path: routerPaths.operator.editExistingKeysSuccess,
    element: <EditExistingKeysSuccessPage />,
  },
  {
    path: routerPaths.operator.setUpOperator,
    element: <SetUpOperatorPage />,
  },
];

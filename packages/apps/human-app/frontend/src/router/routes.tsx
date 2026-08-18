import type { RouteProps } from 'react-router-dom';

import { routerPaths } from '@/router/router-paths';
import { env } from '@/shared/env';

import { RegistrationPage } from '@/modules/worker/oracle-registration';
import {
  HcaptchaLabelingPage,
  EnableLabelerPage,
} from '@/modules/worker/hcaptcha-labeling';
import {
  EmailVerificationProcessPage,
  VerifyEmailPage,
} from '@/modules/worker/email-verification';
import { SignInPage } from '@/modules/signin/sign-in.page';
import { VerifyUserPage } from '@/modules/verify-user/verify-user.page';
import { JobsDiscoveryPage } from '@/modules/worker/jobs-discovery';
import { MyJobsPage } from '@/modules/worker/jobs/my-jobs/my-jobs.page';
import { ProfilePage } from '@/modules/worker/profile';
//import { SignUpPage } from '@/modules/signup/sign-up.page';
import { HomePage } from '@/modules/homepage';
import {
  ResetPasswordPage,
  ResetPasswordSuccessPage,
} from '@/modules/worker/reset-password';
import {
  SendResetLinkPage,
  SendResetLinkSuccessPage,
} from '@/modules/worker/send-reset-link';

export const unprotectedRoutes: RouteProps[] = [
  {
    path: routerPaths.homePage,
    element: <HomePage />,
  },
  {
    path: routerPaths.signIn,
    element: <SignInPage />,
  },
  // {
  //   path: routerPaths.signUp,
  //   element: <SignUpPage />,
  // },
  {
    path: routerPaths.emailVerification,
    element: <EmailVerificationProcessPage />,
  },
  {
    path: routerPaths.verifyEmail,
    element: <VerifyEmailPage />,
  },
  {
    path: routerPaths.verifyUser,
    element: <VerifyUserPage />,
  },
  {
    path: routerPaths.sendResetLink,
    element: <SendResetLinkPage />,
  },
  {
    path: routerPaths.resetPassword,
    element: <ResetPasswordPage />,
  },
  {
    path: routerPaths.sendResetLinkSuccess,
    element: <SendResetLinkSuccessPage />,
  },
  {
    path: routerPaths.resetPasswordSuccess,
    element: <ResetPasswordSuccessPage />,
  },
];

export const protectedRoutes: {
  routerProps: RouteProps;
}[] = [
  {
    routerProps: {
      path: routerPaths.jobsDiscovery,
      element: <JobsDiscoveryPage />,
    },
  },
  {
    routerProps: {
      path: routerPaths.myJobs,
      element: <MyJobsPage />,
    },
  },
  ...(env.VITE_FEATURE_FLAG_JOBS_DISCOVERY
    ? [
        {
          routerProps: {
            path: `${routerPaths.registrationInExchangeOracle}/:address`,
            element: <RegistrationPage />,
          },
        },
      ]
    : []),
  {
    routerProps: {
      path: routerPaths.profile,
      element: <ProfilePage />,
    },
  },
  {
    routerProps: {
      path: routerPaths.HcaptchaLabeling,
      element: <HcaptchaLabelingPage />,
    },
  },
  {
    routerProps: {
      path: routerPaths.enableLabeler,
      element: <EnableLabelerPage />,
    },
  },
];

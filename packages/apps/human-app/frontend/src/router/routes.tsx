import type { RouteProps } from 'react-router-dom';
import { t } from 'i18next';
import { routerPaths } from '@/router/router-paths';
import { SendResetLinkWorkerSuccessPage } from '@/modules/worker/views/send-reset-link/send-reset-link-success.page';
import { ResetPasswordWorkerPage } from '@/modules/worker/views/reset-password/reset-password.page';
import { SendResetLinkWorkerPage } from '@/modules/worker/views/send-reset-link/send-reset-link.page';
import { ResetPasswordWorkerSuccessPage } from '@/modules/worker/views/reset-password/reset-password-success.page';
import { JobsDiscoveryPage } from '@/modules/worker/views/jobs-discovery/jobs-discovery.page';
import { JobsPage } from '@/modules/worker/views/jobs/jobs.page';
import { env } from '@/shared/env';
import { RegistrationPage } from '@/modules/worker/oracle-registration';
import { WorkerProfilePage } from '@/modules/worker/components/profile/profile.page';
import {
  HandIcon,
  ProfileIcon,
  WorkHeaderIcon,
} from '@/shared/components/ui/icons';
import type { PageHeaderProps } from '@/shared/components/layout/protected/page-header';
import { SetUpOperatorPage } from '@/modules/operator/views/sign-up/set-up-operator.page';
import { EditExistingKeysSuccessPage } from '@/modules/operator/views/sign-up/edit-existing-keys-success.page';
import { AddKeysOperatorPage } from '@/modules/operator/views/sign-up/add-keys.page';
import { VerifyEmailWorkerPage } from '@/modules/worker/views/email-verification/verify-email.page';
import { EmailVerificationWorkerPage } from '@/modules/worker/views/email-verification/email-verification.page';
import { AddStakeOperatorPage } from '@/modules/operator/views/sign-up/add-stake.page';
import { ConnectWalletOperatorPage } from '@/modules/operator/views/sign-up/connect-wallet.page';
import { OperatorProfilePage } from '@/modules/operator/views/profile/profile.page';
import { Playground } from '@/modules/playground/views/playground.page';
import { HomePage } from '@/modules/homepage/views/home.page';
import {
  HcaptchaLabelingPage,
  UserStatsAccordion,
  EnableLabelerPage,
} from '@/modules/worker/hcaptcha-labeling';
import { SignUpWorkerPage } from '@/modules/signup/worker';
import { SignInWorkerPage } from '@/modules/signin/worker';

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
    path: routerPaths.operator.connectWallet,
    element: <ConnectWalletOperatorPage />,
  },
  {
    path: routerPaths.worker.emailVerification,
    element: <EmailVerificationWorkerPage />,
  },
  {
    path: routerPaths.worker.verifyEmail,
    element: <VerifyEmailWorkerPage />,
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
  pageHeaderProps: PageHeaderProps;
}[] = [
  {
    routerProps: {
      path: routerPaths.worker.jobsDiscovery,
      element: <JobsDiscoveryPage />,
    },
    pageHeaderProps: {
      headerIcon: <WorkHeaderIcon />,
      headerText: t('protectedPagesHeaders.jobsDiscovery'),
    },
  },
  ...(env.VITE_FEATURE_FLAG_JOBS_DISCOVERY
    ? [
        {
          routerProps: {
            path: `${routerPaths.worker.jobs}/:address`,
            element: <JobsPage />,
          },
          pageHeaderProps: {
            headerIcon: <WorkHeaderIcon />,
            headerText: t('protectedPagesHeaders.jobs'),
          },
        },
        {
          routerProps: {
            path: `${routerPaths.worker.registrationInExchangeOracle}/:address`,
            element: <RegistrationPage />,
          },
          pageHeaderProps: {
            headerIcon: <WorkHeaderIcon />,
            headerText: t('protectedPagesHeaders.registrationInExchangeOracle'),
          },
        },
      ]
    : []),
  {
    routerProps: {
      path: routerPaths.worker.profile,
      element: <WorkerProfilePage />,
    },
    pageHeaderProps: {
      headerIcon: <ProfileIcon />,
      headerText: t('protectedPagesHeaders.profile'),
    },
  },
  {
    routerProps: {
      path: routerPaths.worker.HcaptchaLabeling,
      element: <HcaptchaLabelingPage />,
    },
    pageHeaderProps: {
      headerIcon: <HandIcon />,
      headerText: t('protectedPagesHeaders.hcaptchaLabeling'),
      headerItem: <UserStatsAccordion />,
    },
  },
  {
    routerProps: {
      path: routerPaths.worker.enableLabeler,
      element: <EnableLabelerPage />,
    },
    pageHeaderProps: {
      headerIcon: <HandIcon />,
      headerText: t('protectedPagesHeaders.hcaptchaLabeling'),
      headerItem: <UserStatsAccordion />,
    },
  },
];

export const web3ProtectedRoutes: {
  routerProps: RouteProps;
  pageHeaderProps: PageHeaderProps;
}[] = [
  {
    routerProps: {
      path: routerPaths.operator.profile,
      element: <OperatorProfilePage />,
    },
    pageHeaderProps: {
      headerIcon: <ProfileIcon />,
      headerText: t('web3ProtectedPagesHeaders.profile'),
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

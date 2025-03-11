import type { RouteProps } from 'react-router-dom';
import { t } from 'i18next';
import { routerPaths } from '@/router/router-paths';
import { SendResetLinkWorkerSuccessPage } from '@/modules/worker/views/send-reset-link/send-reset-link-success.page';
import { ResetPasswordWorkerPage } from '@/modules/worker/views/reset-password/reset-password.page';
import { SendResetLinkWorkerPage } from '@/modules/worker/views/send-reset-link/send-reset-link.page';
import { ResetPasswordWorkerSuccessPage } from '@/modules/worker/views/reset-password/reset-password-success.page';
import { env } from '@/shared/env';
import { RegistrationPage } from '@/modules/worker/oracle-registration';
import {
  HandIcon,
  ProfileIcon,
  WorkHeaderIcon,
} from '@/shared/components/ui/icons';
import type { PageHeaderProps } from '@/shared/components/layout/protected/page-header';
import {
  HcaptchaLabelingPage,
  UserStatsAccordion,
  EnableLabelerPage,
} from '@/modules/worker/hcaptcha-labeling';
import {
  WorkerEmailVerificationProcessPage,
  WorkerVerifyEmailPage,
} from '@/modules/worker/email-verification';
import { SignInWorkerPage } from '@/modules/signin/worker';
import { JobsDiscoveryPage } from '@/modules/worker/jobs-discovery';
import { WorkerProfilePage } from '@/modules/worker/profile';
import { SignUpWorkerPage } from '@/modules/signup/worker';
import { OperatorProfilePage } from '@/modules/operator/profile';
import { HomePage } from '@/modules/homepage';
import {
  AddKeysOperatorPage,
  AddStakeOperatorPage,
  ConnectWalletOperatorPage,
  EditExistingKeysSuccessPage,
  SetUpOperatorPage,
} from '@/modules/signup/operator';
import { JobsPage } from '@/modules/worker/jobs';

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
    path: routerPaths.operator.connectWallet,
    element: <ConnectWalletOperatorPage />,
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
